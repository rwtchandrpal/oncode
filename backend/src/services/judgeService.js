// Code-execution service (CQ-07): the one place that turns (driver code, user code, test cases) into
// a Judge0 batch and back. Used by submit, run and admin problem validation.
const { createSubmission, getSubmission, newDeadline, getLanguageId } = require("../utils/judge0Utility");
const { encodeBase64, decodeBase64 } = require("../utils/base64");

const CPP_LANGUAGE_ID = 54;
const CPP_COMPILER_OPTIONS = "-Wall -Werror=return-type";

// Injects user (or reference) code into the driver. A replacer function is used so `$&`-style
// patterns in the code are not interpreted.
const buildSource = (driverCode, code) => driverCode.replaceAll("{{USER_CODE}}", () => code);

const buildPayload = (language, sourceCode, testCases) => {
  const languageId = getLanguageId(String(language).toLowerCase());
  const compilerOptions = languageId === CPP_LANGUAGE_ID ? CPP_COMPILER_OPTIONS : "";
  return testCases.map((testCase) => ({
    language_id: languageId,
    source_code: encodeBase64(sourceCode),
    stdin: encodeBase64(testCase.input),
    expected_output: encodeBase64(testCase.expectedOutput),
    compiler_options: compilerOptions,
  }));
};

// Two-step form for callers that must act between "Judge0 accepted the batch" and "results ready"
// (submit creates its DB record there, BUG-01). Both steps share one deadline (BUG-18).
const startBatch = async ({ language, driverCode, code, testCases }) => {
  const deadline = newDeadline();
  const accepted = await createSubmission(buildPayload(language, buildSource(driverCode, code), testCases), deadline);
  return { tokens: accepted.map((r) => r.token), deadline };
};

const awaitBatch = ({ tokens, deadline }) => getSubmission(tokens, deadline);

// One-shot form: returns Judge0 results in test-case order.
const runBatch = async (args) => awaitBatch(await startBatch(args));

module.exports = { buildSource, buildPayload, startBatch, awaitBatch, runBatch, decodeBase64 };
