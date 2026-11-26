// Builds backend/seed/problems/<slug>.json from its authored sources:
//   spec/<slug>.js            statement, constraints, signature, example explanations, limits
//   tools/gen/<slug>.js       sample inputs + seeded hidden-input generator + constraint validator
//   reference/<slug>/solution.cpp|java
// Expected outputs are NEVER written by hand: they are the C++ reference's stdout on Judge0, run
// through the platform's judge service. verify.js then checks both languages against them.
// Usage (from backend/): node seed/tools/build.js <slug...> | --batch N | --all
const fs = require("fs");
const path = require("path");
const codegen = require("./lib/codegen");
const { makeRng } = require("./lib/rng");
const P = require("./lib/problems");
const { run, canon, ensureJudge0 } = require("./lib/judge");

const rel = (file) => path.relative(P.paths.seed, file).split(path.sep).join("/");

const loadSources = (slug) => {
  const spec = require(P.paths.spec(slug));
  const gen = require(P.paths.gen(slug));
  if (spec.slug !== slug) throw new Error(`spec slug "${spec.slug}" does not match file name`);
  const refs = {};
  for (const { id, ext } of P.LANGS) {
    const file = path.join(P.paths.refDir(slug), `solution.${ext}`);
    if (!fs.existsSync(file)) throw new Error(`missing reference ${rel(file)}`);
    refs[id] = fs.readFileSync(file, "utf8").trim();
  }
  return { spec, gen, refs };
};

const makeCases = (slug, spec, gen) => {
  const params = spec.signature.params;
  const samples = gen.samples.map((args, i) => ({ kind: "sample", note: `example ${i + 1}`, args }));
  const hidden = gen.hidden(makeRng(slug)).map((h) => ({ kind: "hidden", note: h.note, args: h.args }));
  const cases = [...samples, ...hidden];
  if (samples.length !== P.SAMPLE_COUNT) throw new Error(`need exactly ${P.SAMPLE_COUNT} samples, got ${samples.length}`);
  if (cases.length > P.MAX_TESTS) throw new Error(`at most ${P.MAX_TESTS} tests, got ${cases.length}`);

  return cases.map((c, i) => {
    const where = `test ${i + 1} (${c.note})`;
    const names = Object.keys(c.args).sort().join(",");
    if (names !== params.map((p) => p.name).sort().join(",")) throw new Error(`${where}: args ${names} do not match the signature`);
    for (const p of params) P.checkValue(c.args[p.name], p.type, `${where} ${p.name}`);
    try {
      gen.validate(c.args);
    } catch (e) {
      throw new Error(`${where}: violates constraints: ${e.message}`);
    }
    const input = params.map((p) => P.serialize(c.args[p.name])).join("\n");
    if (Buffer.byteLength(input) > P.MAX_CASE_BYTES) throw new Error(`${where}: input is ${Buffer.byteLength(input)} bytes (> 200 KB)`);
    const display = params.map((p) => `${p.name} = ${P.serialize(c.args[p.name])}`).join(", ");
    return { ...c, input, display };
  });
};

const build = async (slug) => {
  const entry = P.listEntry(slug);
  const { spec, gen, refs } = loadSources(slug);
  if (!spec.drivers) codegen.checkSignature(spec.signature);
  const snippets = codegen.generate(spec);
  const cases = makeCases(slug, spec, gen);

  const results = await run({ language: "cpp", driverCode: snippets.cpp.driverCode, code: refs.cpp, testCases: cases.map((c) => ({ input: c.input, expectedOutput: "" })) });
  results.forEach((r, i) => {
    if (r.statusId !== 3 && r.statusId !== 4) {
      throw new Error(`C++ reference failed on test ${i + 1} (${cases[i].note}): ${r.status}\n${r.compileOutput || r.stderr || r.message}`);
    }
  });
  const outputs = results.map((r) => canon(r.stdout));
  outputs.forEach((o, i) => {
    if (!o) throw new Error(`C++ reference printed nothing on test ${i + 1}`);
    if (Buffer.byteLength(o) > P.MAX_CASE_BYTES) throw new Error(`test ${i + 1}: output is ${Buffer.byteLength(o)} bytes (> 200 KB)`);
  });

  const tests = cases.map((c, i) => ({ input: c.input, expectedOutput: outputs[i] }));
  const problem = {
    slug,
    title: entry.title,
    difficulty: entry.difficulty,
    topics: [entry.topic],
    description: spec.description.trim(),
    constraints: spec.constraints,
    examples: cases.slice(0, P.SAMPLE_COUNT).map((c, i) => ({
      input: c.display,
      output: outputs[i],
      ...(spec.examples?.[i]?.explanation ? { explanation: spec.examples[i].explanation } : {}),
    })),
    visibleTestCase: tests[0],
    hiddenTestCases: tests,
    codeSnippets: P.LANGS.map(({ id }) => ({ language: id, ...snippets[id] })),
    referenceSolutions: P.LANGS.map(({ id }) => ({ language: id, code: refs[id] })),
    seedMeta: {
      order: entry.order,
      neetcodeSlug: entry.neetcodeSlug,
      limits: { ...P.DEFAULT_LIMITS, ...spec.limits },
      signature: spec.signature,
      expectedOutputsFrom: "reference/" + slug + "/solution.cpp on Judge0",
      tests: cases.map((c, i) => ({
        n: i + 1,
        kind: c.kind,
        note: c.note,
        inputBytes: Buffer.byteLength(c.input),
        outputBytes: Buffer.byteLength(outputs[i]),
      })),
      notes: spec.notes || "",
    },
  };
  P.writeJson(P.paths.problem(slug), problem);
  return { problem, cases, outputs };
};

// --check: offline only. Generates and validates every input and the code snippets, no Judge0.
const check = (slug) => {
  const { spec, gen } = loadSources(slug);
  if (!spec.drivers) codegen.checkSignature(spec.signature);
  const snippets = codegen.generate(spec);
  for (const { id } of P.LANGS) {
    if (!snippets[id].driverCode.includes("{{USER_CODE}}")) throw new Error(`${id} driver lacks {{USER_CODE}}`);
  }
  return makeCases(slug, spec, gen);
};

(async () => {
  const argv = process.argv.slice(2);
  const slugs = P.selectSlugs(argv);
  if (argv.includes("--check")) {
    let bad = 0;
    for (const slug of slugs) {
      try {
        const cases = check(slug);
        console.log(`OK     ${slug}: ${cases.length} tests, largest input ${Math.max(...cases.map((c) => Buffer.byteLength(c.input)))} B`);
      } catch (e) {
        bad++;
        console.log(`FAILED ${slug}: ${e.message}`);
      }
    }
    process.exit(bad ? 1 : 0);
  }
  await ensureJudge0();
  let failed = 0;
  for (const slug of slugs) {
    try {
      const { cases, outputs } = await build(slug);
      console.log(`BUILT ${slug}: ${cases.length} tests`);
      cases.forEach((c, i) => {
        const show = (s) => (s.length > 70 ? s.slice(0, 67) + "..." : s);
        console.log(`  ${String(i + 1).padStart(2)} ${c.kind.padEnd(6)} ${c.note.padEnd(38)} in=${String(Buffer.byteLength(c.input)).padStart(6)}B  out=${show(outputs[i])}`);
      });
    } catch (e) {
      failed++;
      console.log(`FAILED ${slug}: ${e.message}`);
    }
  }
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e.message);
  process.exit(2);
});
