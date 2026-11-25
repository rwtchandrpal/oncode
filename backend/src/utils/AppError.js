// Errors whose message is safe to show to the client. Anything else is logged server-side and
// answered with a fixed message, so internal details (hosts, ports, stack traces, driver messages)
// never reach the browser (SEC-05).

class AppError extends Error {
  constructor(status, message, code = "ERROR", { cause } = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.expose = true;
    if (cause) this.cause = cause;
  }
}

const EXECUTION_UNAVAILABLE_MESSAGE = "Code execution is temporarily unavailable. Please try again later.";

// Thrown by the Judge0 client for any network, HTTP or timeout failure. The underlying error is kept
// in `cause` for logs only.
class Judge0UnavailableError extends AppError {
  constructor(cause) {
    super(503, EXECUTION_UNAVAILABLE_MESSAGE, "EXECUTION_UNAVAILABLE", { cause });
    this.name = "Judge0UnavailableError";
  }
}

// Sends a client-safe error response. AppErrors keep their status/message; everything else becomes
// a generic message with the given status (500 by default). Server errors are always logged.
const sendError = (res, err, fallbackMessage, fallbackStatus = 500) => {
  if (err instanceof AppError) {
    if (err.status >= 500) console.error(`[${err.code}]`, err.cause || err);
    return res.status(err.status).json({ message: err.message });
  }
  console.error(fallbackMessage, err);
  return res.status(fallbackStatus).json({ message: fallbackMessage });
};

module.exports = { AppError, Judge0UnavailableError, EXECUTION_UNAVAILABLE_MESSAGE, sendError };
