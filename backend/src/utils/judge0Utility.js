const axios = require('axios');
const { AppError, Judge0UnavailableError } = require('./AppError');
const logger = require('./logger');

const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL;
// Per-HTTP-request timeout (a stopped EC2 drops packets, so each call would otherwise hang).
const JUDGE0_TIMEOUT_MS = parseInt(process.env.JUDGE0_TIMEOUT_MS) || 5000;
// Overall budget for one execution (batch create + all polls), BUG-18.
const JUDGE0_DEADLINE_MS = parseInt(process.env.JUDGE0_DEADLINE_MS) || 30000;
const POLL_INTERVAL_MS = 2000;
// Result fields fetched when polling a batch (see getSubmission).
const RESULT_FIELDS = 'token,status_id,stdout,stderr,compile_output,message,time,memory';

// Absolute time by which an execution must finish. Pass the same value to createSubmission and
// getSubmission so the budget covers both.
const newDeadline = () => Date.now() + JUDGE0_DEADLINE_MS;

const remainingMs = (deadline) => deadline - Date.now();

const requestTimeout = (deadline) => {
  const left = remainingMs(deadline);
  if (left <= 0) {
    throw new Judge0UnavailableError(new Error(`Judge0 deadline of ${JUDGE0_DEADLINE_MS} ms exceeded`));
  }
  return Math.min(JUDGE0_TIMEOUT_MS, left);
};

// Health Check Utility
const checkJudge0Health = async () => {
  try {
    const response = await axios.get(`${JUDGE0_BASE_URL}/about`, {
      headers: {
        'X-Auth-Token': process.env.JUDGE0_AUTH_TOKEN
      },
      timeout: 4000
    });
    return {
      isOnline: true,
      version: response.data?.version || 'connected',
      status: response.status
    };
  } catch (error) {
    // Never return error.message: it contains the Judge0 host and port (SEC-05).
    logger.warn({ code: error.code || error.message }, 'Judge0 health check failed');
    return {
      isOnline: false,
      code: error.code || 'UNREACHABLE'
    };
  }
};

// utility function for problem route
// Batched submission to judge0
const createSubmission = async (submissionPayload, deadline = newDeadline()) => {
  const options = {
    method: 'POST',
    url: `${JUDGE0_BASE_URL}/submissions/batch`,
    params: {
      base64_encoded: 'true'
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': process.env.JUDGE0_AUTH_TOKEN 
    },
    data: {
      submissions: submissionPayload
    },
    timeout: requestTimeout(deadline)
  };

  let response;
  try {
    response = await axios.request(options);
  } catch (error) {
    // Internal detail stays in `cause` (logged server-side only).
    throw new Judge0UnavailableError(error);
  }
  if (!Array.isArray(response.data) || response.data.some((r) => !r || !r.token)) {
    throw new Judge0UnavailableError(new Error("Judge0 batch create returned no tokens"));
  }
  return response.data;
}

const waiting = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

// submit token which we get from batched submission to get the final result of submission for testcases
const getSubmission = async (resultTokens, deadline = newDeadline()) => {
  const fetchData = async () => {
    try {
      const response = await axios.request({
        method: 'GET',
        url: `${JUDGE0_BASE_URL}/submissions/batch`,
        params: {
          tokens: resultTokens.join(','),
          base64_encoded: 'true',
          // Only what the platform reads. "*" also returned every test's source code, stdin and expected
          // output (base64); with 200 KB tests that is several MB per poll and timed out the 5 s request.
          fields: RESULT_FIELDS
        },
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': process.env.JUDGE0_AUTH_TOKEN
        },
        timeout: requestTimeout(deadline)
      });
      return response.data;
    } catch (error) {
      if (error instanceof Judge0UnavailableError) throw error;
      throw new Judge0UnavailableError(error);
    }
  };

  // Poll until every test has a terminal status or the overall deadline passes (BUG-18).
  // A poll that merely times out (Judge0 busy compiling a large batch) is retried within the deadline;
  // other failures (connection refused, bad responses) still end the execution at once.
  for (;;) {
    let result;
    try {
      result = await fetchData();
    } catch (error) {
      const slow = error.cause?.code === 'ECONNABORTED' || error.cause?.code === 'ETIMEDOUT';
      if (!slow || remainingMs(deadline) <= POLL_INTERVAL_MS) throw error;
      logger.warn({ code: error.cause.code }, 'Judge0 poll timed out, retrying within the deadline');
      await waiting(POLL_INTERVAL_MS);
      continue;
    }

    if (!result || !Array.isArray(result.submissions)) {
      throw new Judge0UnavailableError(new Error("Judge0 returned no submissions"));
    }
    if (result.submissions.every((r) => r.status_id > 2)) {
      return result.submissions;
    }

    const left = remainingMs(deadline);
    if (left <= POLL_INTERVAL_MS) {
      throw new Judge0UnavailableError(new Error(`Judge0 results not ready within ${JUDGE0_DEADLINE_MS} ms`));
    }
    await waiting(POLL_INTERVAL_MS);
  }
}

const getLanguageId = (language) => {
  // judge0 language id for different languages
  const languageIdMap = {
    'cpp': 54,
    'java': 62,
  };
  const id = languageIdMap[language];
  if (!id) {
    throw new AppError(400, 'Unsupported programming language.', 'UNSUPPORTED_LANGUAGE');
  }
  return id;
}

const getstatusById = (id) => {
  // judge0 status_id mapping
  const statusIdMap = {
    1: "In Queue",
    2: "Processing",
    3: "Accepted",
    4: "Wrong Answer",
    5: "Time Limit Exceeded",
    6: "Compilation Error",
    7: "Runtime Error (SIGSEGV)",
    8: "Runtime Error (SIGXFSZ)",
    9: "Runtime Error (SIGFPE)",
    10: "Runtime Error (SIGABRT)",
    11: "Runtime Error (NZEC)",
    12: "Runtime Error (Other)",
    13: "Internal Error",
    14: "Exec Format Error"
  };
  return statusIdMap[id] || "Unknown Execution Status";
}

module.exports = { createSubmission, getSubmission, newDeadline, getLanguageId, getstatusById, checkJudge0Health };