// Error contract (CQ-04): every error response body is { error: { code, message } } (plus, rarely,
// extra machine-readable fields such as `isLocked` or `details`).
//
// AppError messages are safe to show to the client. Anything else is logged server-side and answered
// with a fixed message, so internal details (hosts, ports, stack traces, driver messages) never reach
// the browser (SEC-05).

const CODE_FOR_STATUS = {
  400: "BAD_REQUEST",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  429: "RATE_LIMITED",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE",
};
const codeForStatus = (status) => CODE_FOR_STATUS[status] || (status >= 500 ? "INTERNAL_ERROR" : "ERROR");

const errorBody = (status, message, code = codeForStatus(status), extra = {}) => ({
  ...extra,
  error: { code, message },
});

class AppError extends Error {
  constructor(status, message, code = codeForStatus(status), { cause, details } = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.expose = true;
    if (cause) this.cause = cause;
    if (details) this.details = details;
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

// Lazily required so this module stays dependency-free for the logger itself.
const log = () => require("./logger");

// Sends a client-safe error response. AppErrors keep their status/code/message; everything else
// becomes a generic message with the given status (500 by default). Server errors are always logged.
const sendError = (res, err, fallbackMessage, fallbackStatus = 500) => {
  if (err instanceof AppError) {
    if (err.status >= 500) log().error({ err: err.cause || err, code: err.code }, err.message);
    const extra = err.details ? { details: err.details } : {};
    return res.status(err.status).json(errorBody(err.status, err.message, err.code, extra));
  }
  log().error({ err }, fallbackMessage);
  return res.status(fallbackStatus).json(errorBody(fallbackStatus, fallbackMessage));
};

module.exports = {
  AppError,
  Judge0UnavailableError,
  EXECUTION_UNAVAILABLE_MESSAGE,
  sendError,
  errorBody,
  codeForStatus,
};
