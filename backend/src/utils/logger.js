// Structured JSON logging (CQ-06). Authorization headers, cookies, passwords and tokens are redacted
// wherever they appear in a log object.
const pino = require("pino");
const env = require("../config/env");

const logger = pino({
  level: env.NODE_ENV === "test" && env.LOG_LEVEL === "info" ? "silent" : env.LOG_LEVEL,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
      "password",
      "*.password",
      "token",
      "*.token",
    ],
    censor: "[redacted]",
  },
  serializers: { err: pino.stdSerializers.err },
});

module.exports = logger;
