// The one place that talks to Gemini (AI tutor).
//
// Temporary server-side failures (e.g. 503 "This model is currently experiencing high demand") are
// retried a couple of times with a short backoff. 429 (rate limit / quota) and other 4xx errors are
// NOT retried: retrying them only burns quota. If every attempt fails, the original error (with its
// HTTP status) reaches the caller, which reports a 503 "AI tutor is busy" to the user.
const { GoogleGenAI } = require('@google/genai');
const { withRetry } = require('./retry');
const logger = require('./logger');

// Model used by the AI tutor
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);
const isRetryableGeminiError = (err) => RETRYABLE_STATUSES.has(err?.status);

// 3 calls in total: the first plus 2 retries after ~0.5 s and ~1 s. Not frozen so tests can shorten
// the delays.
const geminiRetryPolicy = { attempts: 3, baseDelayMs: 500 };

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateContent = (request) =>
  withRetry(() => ai.models.generateContent({ model: GEMINI_MODEL, ...request }), {
    attempts: geminiRetryPolicy.attempts,
    baseDelayMs: geminiRetryPolicy.baseDelayMs,
    isRetryable: isRetryableGeminiError,
    onRetry: ({ attempt, delayMs, err }) =>
      logger.warn({ status: err.status, attempt, delayMs, model: GEMINI_MODEL }, '[gemini] temporary error, retrying'),
  });

module.exports = { GEMINI_MODEL, generateContent, isRetryableGeminiError, geminiRetryPolicy, ai };
