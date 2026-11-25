// Verifies built problems on Judge0 through the platform's judge service (same build + submit path
// as a user submission). For each problem:
//   1. structure: Mongoose Problem validation, 3 samples, <= 10 tests, <= 200 KB per case, files in sync
//   2. C++ and Java references: every test Accepted (Judge0 compares against expectedOutput)
//   3. C++ and Java print identical output on every test
//   4. negative tests: the starter code (each language) compiles and is rejected; reference/<slug>/wrong*.*
//      must be rejected; reference/<slug>/slow*.* is run and its verdicts reported (informational)
//   5. max time / memory per language; flag when the reference uses > 50% of the time limit
// Writes verify-results.json, verify-report.md and (on success) the problem's hash to verified.json.
// Usage (from backend/): node seed/tools/verify.js <slug...> | --batch N | --all
const fs = require("fs");
const path = require("path");
const mongoose = require(path.join(__dirname, "..", "..", "node_modules", "mongoose"));
const P = require("./lib/problems");
const { run, canon, ensureJudge0, BACKEND } = require("./lib/judge");

const Problem = require(path.join(BACKEND, "src", "models", "problem"));
const SCHEMA_FIELDS = ["slug", "title", "difficulty", "topics", "description", "constraints", "examples", "visibleTestCase", "hiddenTestCases", "codeSnippets", "referenceSolutions"];

const checkStructure = async (slug, problem) => {
  const errors = [];
  const doc = new Problem({ ...Object.fromEntries(SCHEMA_FIELDS.map((f) => [f, problem[f]])), problemCreator: new mongoose.Types.ObjectId() });
  try {
    await doc.validate();
  } catch (e) {
    errors.push(`schema: ${e.message}`);
  }
  const tests = problem.hiddenTestCases || [];
  if (tests.length < 1 || tests.length > P.MAX_TESTS) errors.push(`has ${tests.length} tests (1..${P.MAX_TESTS})`);
  if ((problem.examples || []).length !== P.SAMPLE_COUNT) errors.push(`has ${(problem.examples || []).length} examples`);
  if (JSON.stringify(problem.visibleTestCase) !== JSON.stringify(tests[0])) errors.push("visibleTestCase is not test 1");
  problem.examples.forEach((e, i) => {
    if (tests[i] && e.output !== tests[i].expectedOutput) errors.push(`example ${i + 1} output differs from test ${i + 1}`);
  });
  tests.forEach((t, i) => {
    for (const k of ["input", "expectedOutput"]) {
      if (Buffer.byteLength(t[k]) > P.MAX_CASE_BYTES) errors.push(`test ${i + 1} ${k} > 200 KB`);
    }
  });
  for (const { id, ext } of P.LANGS) {
    const ref = path.join(P.paths.refDir(slug), `solution.${ext}`);
    const stored = problem.referenceSolutions.find((r) => r.language === id)?.code;
    if (!fs.existsSync(ref) || fs.readFileSync(ref, "utf8").trim() !== stored) errors.push(`${id} reference in problem JSON differs from ${path.basename(ref)}: rebuild`);
    const snip = problem.codeSnippets.find((s) => s.language === id);
    if (!snip || !snip.driverCode.includes("{{USER_CODE}}")) errors.push(`${id} driver missing or without {{USER_CODE}}`);
  }
  return errors;
};

const summarize = (results) => {
  const counts = {};
  for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
  return Object.entries(counts).map(([s, n]) => `${s} x${n}`).join(", ");
};

// Judge0 infrastructure failures (not verdicts about the code): retried once after a pause.
const isInfraFailure = (r) => r.statusId === 13 || (r.statusId === 6 && /Compilation time limit exceeded/i.test(r.compileOutput || ""));

// One batch at a time: the same load as a single user's Submit. Running many batches in parallel
// starves compiles on the local Judge0 ("Compilation time limit exceeded").
const runCode = async (problem, language, code, notes) => {
  const snip = problem.codeSnippets.find((s) => s.language === language);
  const once = () => run({ language, driverCode: snip.driverCode, code, testCases: problem.hiddenTestCases });
  let res = await once();
  if (res.some(isInfraFailure)) {
    notes.push(`${language}: Judge0 infrastructure failure, re-ran once`);
    await new Promise((r) => setTimeout(r, 5000));
    res = await once();
  }
  return res;
};

const verify = async (slug) => {
  const file = P.paths.problem(slug);
  if (!fs.existsSync(file)) return { slug, ok: false, errors: ["not built (run build.js)"] };
  const hash = P.fileHash(file);
  const problem = P.readJson(file);
  const limits = problem.seedMeta?.limits || P.DEFAULT_LIMITS;
  const errors = await checkStructure(slug, problem);
  const notes = [];
  const out = { slug, title: problem.title, hash, langs: {}, negatives: [], errors, notes };

  // References
  const refRuns = [];
  for (const { id } of P.LANGS) refRuns.push(await runCode(problem, id, problem.referenceSolutions.find((r) => r.language === id).code, notes));
  P.LANGS.forEach(({ id }, li) => {
    const res = refRuns[li];
    const bad = res.map((r, i) => ({ r, i })).filter(({ r }) => r.statusId !== 3);
    const maxTimeMs = Math.max(0, ...res.map((r) => r.timeMs || 0));
    const maxMemoryKb = Math.max(0, ...res.map((r) => r.memoryKb || 0));
    out.langs[id] = { pass: bad.length === 0, maxTimeMs, maxMemoryKb, summary: summarize(res) };
    for (const { r, i } of bad) {
      errors.push(`${id} reference: test ${i + 1} ${r.status}${r.compileOutput ? ": " + r.compileOutput.slice(0, 300) : r.stderr ? ": " + r.stderr.slice(0, 300) : ""}`);
    }
    if (maxTimeMs > limits.timeLimitMs / 2) notes.push(`${id} reference uses ${maxTimeMs} ms (> 50% of ${limits.timeLimitMs} ms)`);
  });
  // Cross-language agreement (only meaningful when both references ran)
  refRuns[0].forEach((r, i) => {
    const other = refRuns[1][i];
    if (r.statusId !== 3 || other.statusId !== 3) return;
    if (canon(r.stdout) !== canon(other.stdout)) errors.push(`C++ and Java differ on test ${i + 1}`);
  });

  // Negative tests
  const negatives = [];
  for (const { id } of P.LANGS) {
    negatives.push({ label: `starter ${id}`, language: id, code: problem.codeSnippets.find((s) => s.language === id).userSnippet, mustFail: true, mustCompile: true });
  }
  const refDir = P.paths.refDir(slug);
  for (const f of fs.readdirSync(refDir).sort()) {
    const m = /^(wrong|slow)[\w-]*\.(cpp|java)$/.exec(f);
    if (m) negatives.push({ label: f, language: m[2], code: fs.readFileSync(path.join(refDir, f), "utf8"), mustFail: m[1] === "wrong", mustCompile: true });
  }
  const negRuns = [];
  for (const n of negatives) negRuns.push(await runCode(problem, n.language, n.code, notes));
  negatives.forEach((n, k) => {
    const res = negRuns[k];
    const rejected = res.filter((r) => r.statusId !== 3).length;
    const compileError = res.some((r) => r.statusId === 6);
    const entry = { label: n.label, rejected, total: res.length, summary: summarize(res), ok: true };
    if (n.mustCompile && compileError) {
      entry.ok = false;
      errors.push(`${n.label} does not compile: ${(res.find((r) => r.statusId === 6).compileOutput || "").slice(0, 300)}`);
    } else if (n.mustFail && rejected === 0) {
      entry.ok = false;
      errors.push(`${n.label} passed every test: the tests cannot reject it`);
    }
    out.negatives.push(entry);
  });

  out.ok = errors.length === 0 && P.LANGS.every(({ id }) => out.langs[id].pass);
  out.verifiedAt = new Date().toISOString();
  return out;
};

const ms = (n) => (n == null ? "-" : `${n} ms`);
const mb = (kb) => (kb == null ? "-" : `${(kb / 1024).toFixed(1)} MB`);

const writeReport = (all) => {
  const order = Object.fromEntries(P.loadList().map((p) => [p.slug, p.order]));
  const rows = Object.values(all).sort((a, b) => order[a.slug] - order[b.slug]);
  const passed = rows.filter((r) => r.ok).length;
  const lines = [
    "# Blind 75 verification report",
    "",
    "Generated by `seed/tools/verify.js` (local Judge0 1.13.1, through `src/services/judgeService.js`).",
    "Times are Judge0 CPU time, max over all tests. Memory is local Judge0 memory, which caps *virtual*",
    "memory (cgroup-less workaround), so it is not comparable with production. Time limit = platform default 5 s.",
    "",
    `**${passed} / ${rows.length} verified.**`,
    "",
    "| # | Slug | C++ | Java | Negative tests | C++ max time / mem | Java max time / mem | Notes |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const r of rows) {
    const lang = (id) => (r.langs?.[id] ? (r.langs[id].pass ? "PASS" : "FAIL") : "-");
    const tm = (id) => (r.langs?.[id] ? `${ms(r.langs[id].maxTimeMs)} / ${mb(r.langs[id].maxMemoryKb)}` : "-");
    const neg = (r.negatives || [])
      .map((n) => `${n.ok ? "" : "**FAIL** "}${n.label}: ${n.rejected}/${n.total} rejected (${n.summary})`)
      .join("<br>");
    const notes = [...(r.errors || []).map((e) => `**${e.replace(/\|/g, "\\|").replace(/\n/g, " ")}**`), ...(r.notes || [])].join("<br>");
    lines.push(`| ${order[r.slug]} | ${r.slug} | ${lang("cpp")} | ${lang("java")} | ${neg} | ${tm("cpp")} | ${tm("java")} | ${notes} |`);
  }
  fs.writeFileSync(P.paths.report, lines.join("\n") + "\n");
};

(async () => {
  const slugs = P.selectSlugs(process.argv.slice(2));
  await ensureJudge0();
  const all = P.readJson(P.paths.results, {});
  const verified = P.readJson(P.paths.verified, {});
  let failed = 0;
  for (const slug of slugs) {
    let r;
    try {
      r = await verify(slug);
    } catch (e) {
      r = { slug, ok: false, errors: [`verify crashed: ${e.message}`], langs: {}, negatives: [], notes: [] };
    }
    all[slug] = r;
    if (r.ok) {
      verified[slug] = { sha256: r.hash, verifiedAt: r.verifiedAt };
    } else {
      delete verified[slug];
      failed++;
    }
    const l = (id) => (r.langs?.[id] ? `${id} ${r.langs[id].pass ? "PASS" : "FAIL"} ${ms(r.langs[id].maxTimeMs)}` : `${id} -`);
    console.log(`${r.ok ? "OK  " : "FAIL"} ${slug.padEnd(40)} ${l("cpp").padEnd(18)} ${l("java").padEnd(18)} neg: ${(r.negatives || []).map((n) => `${n.label} ${n.rejected}/${n.total}`).join("; ")}`);
    for (const e of r.errors || []) console.log(`       error: ${e.split("\n")[0]}`);
    for (const n of r.notes || []) console.log(`       note: ${n}`);
    P.writeJson(P.paths.results, all);
    P.writeJson(P.paths.verified, verified);
    writeReport(all);
  }
  console.log(`\n${slugs.length - failed}/${slugs.length} verified. Report: seed/verify-report.md`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e.message);
  process.exit(2);
});
