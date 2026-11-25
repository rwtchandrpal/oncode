// Shared helpers for build.js / verify.js / seed.js: paths, slug selection, value checks.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SEED = path.join(__dirname, "..", "..");
const paths = {
  seed: SEED,
  list: path.join(SEED, "blind75-list.json"),
  batches: path.join(SEED, "batches.json"),
  spec: (slug) => path.join(SEED, "spec", `${slug}.js`),
  gen: (slug) => path.join(SEED, "tools", "gen", `${slug}.js`),
  refDir: (slug) => path.join(SEED, "reference", slug),
  problem: (slug) => path.join(SEED, "problems", `${slug}.json`),
  verified: path.join(SEED, "verified.json"),
  results: path.join(SEED, "verify-results.json"),
  report: path.join(SEED, "verify-report.md"),
};

const LANGS = [
  { id: "cpp", ext: "cpp" },
  { id: "java", ext: "java" },
];

const MAX_TESTS = 10;
const SAMPLE_COUNT = 3;
const MAX_CASE_BYTES = 200 * 1024;
const DEFAULT_LIMITS = { timeLimitMs: 5000, memoryLimitMb: 256 }; // 5 s = Judge0 default the platform runs with

const readJson = (file, fallback) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback);
const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
};
const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");
const fileHash = (file) => sha256(fs.readFileSync(file));

const loadList = () => readJson(paths.list).problems;

// argv: slugs, or --batch N, or --all
const selectSlugs = (argv) => {
  const list = loadList();
  const known = new Set(list.map((p) => p.slug));
  let slugs;
  if (argv.includes("--all")) {
    slugs = list.map((p) => p.slug).filter((s) => fs.existsSync(paths.spec(s)));
  } else if (argv.includes("--batch")) {
    const n = argv[argv.indexOf("--batch") + 1];
    slugs = readJson(paths.batches, {})[n];
    if (!slugs) throw new Error(`No batch "${n}" in batches.json`);
  } else {
    slugs = argv.filter((a) => !a.startsWith("--"));
  }
  if (!slugs.length) throw new Error("No problems selected. Pass slugs, --batch N or --all.");
  for (const s of slugs) if (!known.has(s)) throw new Error(`Unknown slug "${s}" (not in blind75-list.json)`);
  return slugs;
};

const listEntry = (slug) => loadList().find((p) => p.slug === slug);

// Value check against a signature type. Strings must be printable ASCII (the I/O format's alphabet).
const INT_MIN = -2147483648;
const INT_MAX = 2147483647;
const PRINTABLE = /^[\x20-\x7e]*$/;
const checkValue = (value, type, where) => {
  const bad = (why) => {
    throw new Error(`${where}: ${why} (type ${type})`);
  };
  const elem = type.endsWith("[]") ? type.slice(0, -2) : /^List<(.*)>$/.test(type) ? type.slice(5, -1) : null;
  if (elem) {
    if (!Array.isArray(value)) bad("expected an array");
    value.forEach((v, i) => checkValue(v, elem, `${where}[${i}]`));
    return;
  }
  switch (type) {
    case "int":
      if (!Number.isInteger(value) || value < INT_MIN || value > INT_MAX) bad(`not a 32-bit integer: ${value}`);
      return;
    case "long":
      if (!Number.isSafeInteger(value)) bad(`not a safe integer: ${value}`);
      return;
    case "bool":
      if (typeof value !== "boolean") bad("expected boolean");
      return;
    case "string":
      if (typeof value !== "string" || !PRINTABLE.test(value)) bad("expected printable ASCII string");
      return;
    case "char":
      if (typeof value !== "string" || value.length !== 1 || !PRINTABLE.test(value)) bad("expected one printable character");
      return;
    default:
      bad("unknown type");
  }
};

// Canonical text of a value: the same format the drivers read and print (see FORMAT.md).
const serialize = (value) => JSON.stringify(value);

module.exports = {
  paths, LANGS, MAX_TESTS, SAMPLE_COUNT, MAX_CASE_BYTES, DEFAULT_LIMITS,
  readJson, writeJson, sha256, fileHash, loadList, selectSlugs, listEntry, checkValue, serialize,
};
