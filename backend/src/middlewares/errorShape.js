const { codeForStatus } = require("../utils/AppError");

// Normalizes every error response to { error: { code, message } } (CQ-04).
// Controllers, middlewares and rate limiters that still answer with { message } or { error: "..." }
// are converted here, so the contract holds for every route without touching each call site.
// Extra fields (e.g. `isLocked`, `details`) are kept next to `error`.
const errorShape = (req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400 && body && typeof body === "object" && !Array.isArray(body)) {
      const alreadyShaped = body.error && typeof body.error === "object" && typeof body.error.message === "string";
      if (!alreadyShaped) {
        const { message, error, code, success: _success, ...rest } = body;
        const text = typeof message === "string" ? message : typeof error === "string" ? error : "Request failed.";
        return json({ ...rest, error: { code: code || codeForStatus(res.statusCode), message: text } });
      }
    }
    return json(body);
  };
  next();
};

module.exports = errorShape;
