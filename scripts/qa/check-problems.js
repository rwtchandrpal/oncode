#!/usr/bin/env node
// Read-only structural check of the problems in a MongoDB database (pre-release QA, step 3).
//
//   MONGO_URI=mongodb://127.0.0.1:27018/oncode_test?directConnection=true node scripts/qa/check-problems.js
//   node scripts/qa/check-problems.js --env backend/.env       # MONGO_URI from that file (never printed)
//
// Only reads: find, countDocuments, listIndexes. Prints the host and db name, never credentials.
// Checks: exactly 75 problems; unique slug, title and number; description, examples, difficulty, topics,
// constraints, visible test, 1..10 hidden tests, cpp + java userSnippet/driverCode (with {{USER_CODE}})
// and reference solutions; problemCreator is an existing admin; each problem equals its seed file
// (backend/seed/problems/<slug>.json). Also reports users by role, submissions, guest submissions,
// counters and legacy demo indexes (stale data).
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..", "..");
const BACKEND = path.join(ROOT, "backend");
const mongoose = require(path.join(BACKEND, "node_modules", "mongoose"));

const args = process.argv.slice(2);
const envFile = args.includes("--env") ? args[args.indexOf("--env") + 1] : null;
if (envFile) require(path.join(BACKEND, "node_modules", "dotenv")).config({ path: path.resolve(envFile), quiet: true });
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is not set");
  process.exit(2);
}
const target = (() => {
  try {
    const u = new URL(uri);
    return `${u.protocol}//${u.hostname}${u.pathname}`;
  } catch {
    return "(unparseable)";
  }
})();

const EXPECTED_COUNT = 75;
const LANGS = ["cpp", "java"];
const SEED_DIR = path.join(BACKEND, "seed", "problems");
const SEED_FIELDS = ["title", "difficulty", "topics", "description", "constraints", "examples", "visibleTestCase", "hiddenTestCases", "codeSnippets", "referenceSolutions"];

// Content-only view: drops subdocument _ids so DB documents compare equal to seed JSON
const strip = (v) => {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === "object" && !(v instanceof Date) && !(v._bsontype)) {
    const out = {};
    for (const k of Object.keys(v).sort()) if (k !== "_id") out[k] = strip(v[k]);
    return out;
  }
  return v;
};

const checkProblem = (p, adminIds) => {
  const issues = [];
  const need = (cond, msg) => !cond && issues.push(msg);
  need(typeof p.slug === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug), "bad/missing slug");
  need(p.title && p.title.trim(), "missing title");
  need(Number.isInteger(p.number), "missing number");
  need(p.description && p.description.trim().length > 20, "missing/short description");
  need(Array.isArray(p.examples) && p.examples.length > 0 && p.examples.every((e) => e.input && e.output), "missing examples");
  need(["Easy", "Medium", "Hard"].includes(p.difficulty), "bad difficulty");
  need(Array.isArray(p.topics) && p.topics.length > 0 && p.topics.every((t) => typeof t === "string" && t.trim()), "missing topics");
  need(Array.isArray(p.constraints) && p.constraints.length > 0, "missing constraints");
  need(p.visibleTestCase && p.visibleTestCase.input != null && p.visibleTestCase.expectedOutput, "missing visible test");
  const hidden = p.hiddenTestCases || [];
  need(hidden.length >= 1 && hidden.length <= 10, `hidden tests = ${hidden.length} (want 1..10)`);
  need(hidden.every((t) => typeof t.input === "string" && typeof t.expectedOutput === "string" && t.expectedOutput.length), "empty hidden test");
  for (const lang of LANGS) {
    const snips = (p.codeSnippets || []).filter((s) => String(s.language).toLowerCase() === lang);
    need(snips.length === 1, `${lang}: ${snips.length} code snippets`);
    if (snips[0]) {
      need(snips[0].userSnippet && snips[0].userSnippet.trim(), `${lang}: empty starter code`);
      need(snips[0].driverCode && snips[0].driverCode.includes("{{USER_CODE}}"), `${lang}: driver lacks {{USER_CODE}}`);
    }
    const refs = (p.referenceSolutions || []).filter((s) => String(s.language).toLowerCase() === lang);
    need(refs.length === 1 && refs[0].code && refs[0].code.trim(), `${lang}: reference solution missing`);
  }
  need(p.problemCreator && adminIds.has(String(p.problemCreator)), "problemCreator is not an existing admin");

  const seedPath = path.join(SEED_DIR, `${p.slug}.json`);
  if (!fs.existsSync(seedPath)) issues.push("no seed file for slug");
  else {
    const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
    const diff = SEED_FIELDS.filter((f) => JSON.stringify(strip(seed[f])) !== JSON.stringify(strip(p[f])));
    if (diff.length) issues.push(`differs from seed: ${diff.join(",")}`);
  }
  return issues;
};

(async () => {
  await mongoose.connect(uri, { readPreference: "secondaryPreferred" });
  const db = mongoose.connection.db;
  console.log(`Target: ${target} (read-only)`);

  const problems = await db.collection("problems").find({}).sort({ number: 1 }).toArray();
  const users = await db.collection("users").find({}, { projection: { role: 1, createdAt: 1 } }).toArray();
  const adminIds = new Set(users.filter((u) => u.role === "admin").map((u) => String(u._id)));

  const rows = problems.map((p) => ({ number: p.number, slug: p.slug, difficulty: p.difficulty, hidden: (p.hiddenTestCases || []).length, issues: checkProblem(p, adminIds) }));
  const dup = (key) => {
    const seen = new Map();
    problems.forEach((p) => seen.set(p[key], (seen.get(p[key]) || 0) + 1));
    return [...seen].filter(([, n]) => n > 1).map(([k]) => k);
  };
  const seedSlugs = fs.readdirSync(SEED_DIR).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));
  const dbSlugs = new Set(problems.map((p) => p.slug));

  const roleCounts = users.reduce((m, u) => ((m[u.role] = (m[u.role] || 0) + 1), m), {});
  const count = async (c, q = {}) => db.collection(c).countDocuments(q).catch(() => "n/a");
  const indexes = async (c) => (await db.collection(c).listIndexes().toArray().catch(() => [])).map((i) => i.name);
  const counters = await db.collection("counters").find({}).toArray().catch(() => []);
  const numbers = problems.map((p) => p.number).filter(Number.isInteger);

  const global = [];
  if (problems.length !== EXPECTED_COUNT) global.push(`problem count ${problems.length}, expected ${EXPECTED_COUNT}`);
  for (const k of ["slug", "title", "number"]) {
    const d = dup(k);
    if (d.length) global.push(`duplicate ${k}: ${d.join(", ")}`);
  }
  const missing = seedSlugs.filter((s) => !dbSlugs.has(s));
  if (missing.length) global.push(`seed slugs missing in DB: ${missing.join(", ")}`);
  if (numbers.length && (Math.min(...numbers) !== 1 || Math.max(...numbers) !== numbers.length)) global.push(`numbers not 1..${numbers.length} (min ${Math.min(...numbers)}, max ${Math.max(...numbers)})`);
  if ((roleCounts.admin || 0) !== 1) global.push(`admin count ${roleCounts.admin || 0}, expected 1`);

  const stale = {
    usersByRole: roleCounts,
    submissions: await count("submissions"),
    submissionsWithMissingUser: await (async () => {
      const ids = new Set(users.map((u) => String(u._id)));
      const subs = await db.collection("submissions").find({}, { projection: { userId: 1, problemId: 1 } }).toArray().catch(() => []);
      return subs.filter((s) => !ids.has(String(s.userId)) || !dbSlugs.size || !problems.some((p) => String(p._id) === String(s.problemId))).length;
    })(),
    usersWithStaleSolved: await (async () => {
      const pids = new Set(problems.map((p) => String(p._id)));
      const us = await db.collection("users").find({}, { projection: { problemsSolved: 1 } }).toArray();
      return us.filter((u) => (u.problemsSolved || []).some((id) => !pids.has(String(id)))).length;
    })(),
    guestSubmissions: await count("guestsubmissions"),
    legacyDemoDocs: { users: await count("users", { isDemo: { $exists: true } }), submissions: await count("submissions", { isDemo: { $exists: true } }) },
    indexes: { users: await indexes("users"), submissions: await indexes("submissions"), problems: await indexes("problems") },
    counters: counters.map((c) => `${c._id}=${c.seq}`),
  };

  console.log("\n| # | slug | difficulty | hidden tests | result | issue |\n|---|---|---|---|---|---|");
  for (const r of rows) console.log(`| ${r.number} | ${r.slug} | ${r.difficulty} | ${r.hidden} | ${r.issues.length ? "FAIL" : "OK"} | ${r.issues.join("; ")} |`);
  console.log("\nGlobal:", global.length ? global : "OK");
  console.log("Data state:", JSON.stringify(stale, null, 2));
  const failed = rows.filter((r) => r.issues.length).length;
  console.log(`\n${rows.length} problems, ${rows.length - failed} OK, ${failed} with issues`);
  await mongoose.disconnect();
  process.exit(global.length || failed ? 1 : 0);
})().catch((err) => {
  console.error("check failed:", err.name, err.codeName || "");
  process.exit(2);
});
