const axios = require('axios');

// Replace this with your actual AWS Elastic IP

const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL;
const JUDGE0_TIMEOUT_MS = parseInt(process.env.JUDGE0_TIMEOUT_MS) || 10000;

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
    return {
      isOnline: false,
      error: error.message,
      code: error.code || 'UNREACHABLE'
    };
  }
};

// utility function for problem route
// Batched submission to judge0
const createSubmission = async (submissionPayload) => {
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
    timeout: JUDGE0_TIMEOUT_MS
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    const serverMessage = error.response?.data?.message || error.response?.data?.error;
    const detail = serverMessage ? `: ${JSON.stringify(serverMessage)}` : ` (${error.message})`;
    throw new Error("Failed to submit Batch to judge0" + detail);
  }
}

const waiting = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

// submit token which we get from batched submission to get the final result of submission for testcases
const getSubmission = async (resultTokens) => {
  const options = {
    method: 'GET',
    url: `${JUDGE0_BASE_URL}/submissions/batch`,
    params: {
      tokens: resultTokens.join(','),
      base64_encoded: 'true',
      fields: '*'
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': process.env.JUDGE0_AUTH_TOKEN 
    },
    timeout: JUDGE0_TIMEOUT_MS
  };

  async function fetchData() {
    try {
      const response = await axios.request(options);
      return response.data;
    } catch (error) {
      throw new Error("Failed to submit Tokens to judge0: " + (error.response?.data?.error || error.message));
    }
  }

  const maxAttempts = 20;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await fetchData();

    if (!result || !result.submissions) {
      throw new Error("Failed to fetch submission result from judge0");
    }
    const isResultObtained = result.submissions.every((r) => r.status_id > 2);

    if (isResultObtained) {
      return result.submissions;
    }

    await waiting(2000);
    attempts++;
  }

  throw new Error("judge0 did not return results after maximum retries");
}

const getLanguageId = (language) => {
  // judge0 language id for different languages
  const languageIdMap = {
    'cpp': 54,
    'java': 62,
  };
  const id = languageIdMap[language];
  if (!id) {
    throw new Error('Unsupported programming language: ' + language);
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

module.exports = { createSubmission, getSubmission, getLanguageId, getstatusById, checkJudge0Health };