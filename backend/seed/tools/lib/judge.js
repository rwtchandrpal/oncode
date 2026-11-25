// Runs code through the platform's own judge service (src/services/judgeService.js), so the program is
// built and submitted exactly as for a user submission: driver + code, base64 batch, same compiler flags.
// Only the overall deadline is longer, because verification sends bigger batches than one user does.
const path = require("path");

const BACKEND = path.join(__dirname, "..", "..", "..");
process.env.JUDGE0_DEADLINE_MS = process.env.JUDGE0_DEADLINE_MS_SEED || "600000";
process.env.JUDGE0_TIMEOUT_MS = process.env.JUDGE0_TIMEOUT_MS_SEED || "30000";
process.env.LOG_LEVEL = process.env.LOG_LEVEL || "silent";
// Loads backend/.env (values are never printed). Variables set above win over the file.
require(path.join(BACKEND, "node_modules", "dotenv")).config({ path: path.join(BACKEND, ".env"), quiet: true });

const judgeService = require(path.join(BACKEND, "src", "services", "judgeService"));
const { getstatusById, checkJudge0Health } = require(path.join(BACKEND, "src", "utils", "judge0Utility"));
const { decodeBase64 } = require(path.join(BACKEND, "src", "utils", "base64"));

const MAX_BATCH = 20; // Judge0 max_submission_batch_size

// Judge0's comparison, as probed on the local instance: trailing whitespace on each line and trailing
// blank lines are ignored; everything else is exact.
const canon = (text) =>
  String(text ?? "")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");

// Judge0 infrastructure failures (not verdicts about the code): an overloaded local Judge0 reports
// "Compilation time limit exceeded" for compiles starved of CPU, or Internal Error.
const isInfraFailure = (r) => r.statusId === 13 || (r.statusId === 6 && /Compilation time limit exceeded/i.test(r.compileOutput || ""));
const INFRA_RETRIES = 3;

// testCases: [{ input, expectedOutput }]. expectedOutput may be "" when only stdout is wanted.
// The returned array has a `retries` property: how many times infrastructure failures forced a re-run.
const run = async (args) => {
  let results = await runOnce(args);
  let retries = 0;
  while (results.some(isInfraFailure) && retries < INFRA_RETRIES) {
    retries++;
    await new Promise((r) => setTimeout(r, 5000 * retries));
    results = await runOnce(args);
  }
  results.retries = retries;
  return results;
};

const runOnce = async ({ language, driverCode, code, testCases }) => {
  const results = [];
  for (let i = 0; i < testCases.length; i += MAX_BATCH) {
    const chunk = testCases.slice(i, i + MAX_BATCH);
    const raw = await judgeService.runBatch({ language, driverCode, code, testCases: chunk });
    for (const r of raw) {
      results.push({
        statusId: r.status_id,
        status: getstatusById(r.status_id),
        stdout: decodeBase64(r.stdout),
        stderr: decodeBase64(r.stderr),
        compileOutput: decodeBase64(r.compile_output),
        message: decodeBase64(r.message),
        timeMs: r.time ? Math.round(parseFloat(r.time) * 1000) : null,
        memoryKb: r.memory ?? null,
      });
    }
  }
  return results;
};

const ensureJudge0 = async () => {
  const health = await checkJudge0Health();
  if (!health.isOnline) {
    throw new Error(`Judge0 is unreachable (${health.code}). Start it (~/judge0/start.sh in WSL) and retry.`);
  }
  return health;
};

module.exports = { run, canon, ensureJudge0, isInfraFailure, BACKEND };
