// Small retry helper for calls to flaky upstream services.
//
// Retries fn() while isRetryable(err) is true, up to `attempts` calls in total, waiting
// baseDelayMs * 2^(n-1) plus up to 50% random jitter between tries. The last error is rethrown
// unchanged, so callers can still read its status.
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async (fn, { attempts = 3, baseDelayMs = 500, isRetryable = () => false, onRetry, sleep = defaultSleep } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt === attempts || !isRetryable(err)) throw err;
      const delayMs = Math.round(baseDelayMs * 2 ** (attempt - 1) * (1 + Math.random() * 0.5));
      onRetry?.({ attempt, delayMs, err });
      await sleep(delayMs);
    }
  }
  throw lastError;
};

module.exports = { withRetry };
