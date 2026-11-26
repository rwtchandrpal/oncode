// Code-execution service: the one place that turns (driver code, user code, test cases) into
// a Judge0 batch and back. Used by submit, run and admin problem validation.
const { createSubmission, getSubmission, newDeadline, getLanguageId } = require("../utils/judge0Utility");
const { encodeBase64, decodeBase64 } = require("../utils/base64");
const { Judge0UnavailableError } = require("../utils/AppError");

const CPP_LANGUAGE_ID = 54;
const CPP_COMPILER_OPTIONS = "-Wall -Werror=return-type";

// Injects user (or reference) code into the driver. A replacer function is used so `$&`-style
// patterns in the code are not interpreted.
const buildSource = (driverCode, code) => driverCode.replaceAll("{{USER_CODE}}", () => code);

// Per-test time limits sent with every submission (seconds). Without them Judge0 applies its defaults
// (5 s CPU, 10 s wall), so one infinite loop held 10 workers for ~50 s of CPU and pushed other users'
// submissions past JUDGE0_DEADLINE_MS. Java gets more because its CPU time includes JVM start-up.
// Headroom over the slowest seed reference solution: C++ 110 ms of 2 s, Java 1.5 s of 4 s.
// Wall time adds 2 s for process start and I/O. Judge0 caps both (MAX_CPU_TIME_LIMIT 15, MAX_WALL_TIME_LIMIT 20).
const TIME_LIMITS = {
  cpp: { cpu: 2, wall: 4 },
  java: { cpu: 4, wall: 6 },
};

const buildPayload = (language, sourceCode, testCases) => {
  const lang = String(language).toLowerCase();
  const languageId = getLanguageId(lang);
  const compilerOptions = languageId === CPP_LANGUAGE_ID ? CPP_COMPILER_OPTIONS : "";
  const limits = TIME_LIMITS[lang];
  return testCases.map((testCase) => ({
    language_id: languageId,
    source_code: encodeBase64(sourceCode),
    stdin: encodeBase64(testCase.input),
    expected_output: encodeBase64(testCase.expectedOutput),
    compiler_options: compilerOptions,
    cpu_time_limit: limits.cpu,
    wall_time_limit: limits.wall,
  }));
};

// Two-step form for callers that must act between "Judge0 accepted the batch" and "results ready"
// (submit creates its DB record there). Both steps share one deadline.
const startBatch = async ({ language, driverCode, code, testCases }) => {
  const deadline = newDeadline();
  const accepted = await createSubmission(buildPayload(language, buildSource(driverCode, code), testCases), deadline);
  return { tokens: accepted.map((r) => r.token), deadline };
};

// An overloaded Judge0 reports compiles starved of CPU as status 6 (Compilation Error) with this
// message. That is not a verdict about the code, so it is treated like Judge0 being unavailable.
const COMPILE_STARVED = /^Compilation time limit exceeded/i;
const isStarvedCompile = (r) => r.status_id === 6 && COMPILE_STARVED.test(decodeBase64(r.compile_output).trim());

const awaitBatch = async ({ tokens, deadline }) => {
  const results = await getSubmission(tokens, deadline);
  if (results.some(isStarvedCompile)) {
    throw new Judge0UnavailableError(new Error("Judge0 compile time limit exceeded (server overloaded)"));
  }
  return results;
};

// One-shot form: returns Judge0 results in test-case order.
const runBatch = async (args) => awaitBatch(await startBatch(args));

module.exports = { buildSource, buildPayload, startBatch, awaitBatch, runBatch, decodeBase64, TIME_LIMITS };
