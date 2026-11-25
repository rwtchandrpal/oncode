const client = require("../config/redis");
const logger = require('./logger');

const JWT_ERROR_NAMES = new Set(["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"]);

// Returns true if the token was revoked by logout. Fails OPEN when Redis is unavailable: a logged-out
// token stays usable until it expires (at most 1 h, 24 h for demo) rather than logging every user out
// or failing every request during a Redis outage (BUG-04). The outage is logged as a warning.
const isTokenBlocked = async (token) => {
  try {
    return Boolean(await client.exists(`token:${token}`));
  } catch (err) {
    logger.warn({ code: err.code || err.message }, "[auth] token blocklist check skipped (Redis unavailable)");
    return false;
  }
};

module.exports = { isTokenBlocked, JWT_ERROR_NAMES };
