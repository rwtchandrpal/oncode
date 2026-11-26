// Writes backend/seed/FINAL_REPORT.md from the files on disk (verify-results.json, verified.json,
// blocked.json, blind75-list.json). Usage (from backend/): node seed/tools/final-report.js
const fs = require("fs");
const path = require("path");
const P = require("./lib/problems");

const list = P.loadList();
const results = P.readJson(P.paths.results, {});
const verified = P.readJson(P.paths.verified, {});
const blocked = P.readJson(path.join(P.paths.seed, "blocked.json"), {});

const statusOf = (slug) => {
  if (blocked[slug]) return "BLOCKED";
  const file = P.paths.problem(slug);
  if (!fs.existsSync(file)) return "NOT STARTED";
  if (verified[slug] && verified[slug].sha256 === P.fileHash(file)) return "VERIFIED";
  return results[slug] ? "FAILED" : "BUILT";
};

const rows = list.map((p) => ({ ...p, status: statusOf(p.slug), r: results[p.slug] }));
const count = (s) => rows.filter((r) => r.status === s).length;
const byDifficulty = (s) => ["Easy", "Medium", "Hard"].map((d) => `${d} ${rows.filter((r) => r.status === s && r.difficulty === d).length}`).join(", ");

const neg = (r) => {
  if (!r || !r.negatives) return "-";
  const must = r.negatives.filter((n) => /^(starter|wrong)/.test(n.label));
  const ok = must.every((n) => n.ok && n.rejected > 0);
  return `${ok ? "rejected" : "**NOT rejected**"} (${must.map((n) => `${n.label} ${n.rejected}/${n.total}`).join("; ")})`;
};
const slowNote = (r) => {
  const slow = (r?.negatives || []).filter((n) => /^slow/.test(n.label));
  return slow.map((n) => `${n.label}: ${n.rejected ? `caught ${n.rejected}/${n.total}` : "passes"}`).join("; ");
};
const lang = (r, id) => (r?.langs?.[id] ? `${r.langs[id].pass ? "PASS" : "FAIL"} (${r.langs[id].maxTimeMs} ms)` : "-");

const lines = [
  "# Blind 75 seed: final report",
  "",
  `Generated ${new Date().toISOString().slice(0, 10)} by \`seed/tools/final-report.js\` from the verification results on disk.`,
  "",
  "## Summary",
  "",
  `- **VERIFIED: ${count("VERIFIED")}** of ${list.length} (${byDifficulty("VERIFIED")})`,
  `- BLOCKED: ${count("BLOCKED")}`,
  `- FAILED (built, last verification failed): ${count("FAILED")}`,
  `- BUILT but not verified: ${count("BUILT")}`,
  `- NOT STARTED: ${count("NOT STARTED")}`,
  "",
  "Every VERIFIED problem passed, on the local Judge0 through the platform's own `judgeService`: all tests",
  "Accepted for the C++ and the Java reference, identical output from both, and rejection of the starter code",
  "(and of every `wrong*` solution) in both languages. Expected outputs all come from the C++ reference.",
  "",
  "## Problems",
  "",
  "| # | Problem | Difficulty | Status | C++ ref | Java ref | Negative tests | Slow solutions (informational) |",
  "|---|---|---|---|---|---|---|---|",
  ...rows.map((r) => `| ${r.order} | ${r.slug} | ${r.difficulty} | ${r.status} | ${lang(r.r, "cpp")} | ${lang(r.r, "java")} | ${neg(r.r)} | ${slowNote(r.r)} |`),
  "",
  "## Blocked problems",
  "",
  ...(Object.keys(blocked).length
    ? Object.entries(blocked).map(([s, b]) => `- **${s}**: ${b.error}. Tried: ${(b.tried || []).join("; ")}`)
    : ["None."]),
  "",
  "## Key decisions",
  "",
  "Full list in `DECISIONS.md`. The ones that matter most when seeding and running the platform:",
  "",
  "- The optional `slug` field added to `src/models/problem.js` (approved) is **not committed**; commit it with",
  "  the seed, or `seed.js` falls back to matching problems by title.",
  "- Each problem stores 3 examples, sample 1 as `visibleTestCase` (Run) and all 10 tests in `hiddenTestCases` (Submit).",
  "- No per-problem time limits reach Judge0 (platform limitation), so the 5 s default applies; with inputs capped at",
  "  200 KB, O(n^2) array solutions are usually **not** caught (see the slow-solution column).",
  "- Recursive Java DFS overflows near 10^4 levels on Judge0's default JVM stack; grid tests are sized below that.",
  "- Problems with several correct answers are normalised in the driver (sorting), made unique by the generator,",
  "  or validated (Alien Dictionary). Design problems use LeetCode's operations/arguments format.",
  "- Reference solutions are seeded into `referenceSolutions` (shown on the Solution tab after solving).",
  "",
  "## How to seed",
  "",
  "Run from `backend/`. The first command touches no database; the second only reads it.",
  "",
  "```",
  "node seed/seed.js --dry-run",
  "node seed/seed.js --dry-run --connect --creator <admin email>",
  "node seed/seed.js --creator <admin email> --yes",
  "```",
  "",
  "To re-check everything first (needs the local Judge0): `node seed/tools/build.js --all --check`, then",
  "`node seed/tools/verify.js --all`.",
];

fs.writeFileSync(path.join(P.paths.seed, "FINAL_REPORT.md"), lines.join("\n") + "\n");
console.log(`VERIFIED ${count("VERIFIED")}, BLOCKED ${count("BLOCKED")}, FAILED ${count("FAILED")}, BUILT ${count("BUILT")}, NOT STARTED ${count("NOT STARTED")}`);
