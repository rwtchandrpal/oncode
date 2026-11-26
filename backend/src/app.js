// The Express application, without connecting to databases or listening (F1: tests import this).
// config/env must load first: it reads .env and validates every variable (CQ-02).
const env = require("./config/env");
const express = require("express");
const cors = require('cors');
const compression = require("compression");
const helmet = require("helmet");


const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemRoutes");
const submitRouter = require("./routes/submitRoute");
const adminRouter = require('./routes/adminRoutes');
const chatAIRouter = require('./routes/chatAIRoute');
const healthRouter = require("./routes/healthRoutes");
const logger = require("./utils/logger");
const pinoHttp = require("pino-http");
const errorShape = require("./middlewares/errorShape");
const { AppError, sendError, errorBody } = require("./utils/AppError");


const app = express();

// Security headers (SEC-12). The API is called cross-origin by the SPA, so resources must be
// readable cross-origin; CORS below still restricts which origin may call it.
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Number of reverse proxies in front of the API (SEC-09). 0 (default) trusts none, so req.ip is the
// socket address and X-Forwarded-For cannot be spoofed. Set TRUST_PROXY_HOPS to the host's real hop count.
app.set("trust proxy", env.TRUST_PROXY_HOPS);

// Normalize every error body to { error: { code, message } } (CQ-04)
app.use(errorShape);

// Request logging with redacted Authorization header (CQ-06)
app.use(pinoHttp({
  logger,
  // Probes hit these every few seconds; keep them out of the request log
  autoLogging: { ignore: (req) => req.url === "/healthz" || req.url === "/readyz" },
  customLogLevel: (req, res, err) => (err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info"),
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url, headers: { authorization: req.headers.authorization } }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}));

// Bearer tokens, no cookies: credentials are not needed (SEC-15). Only the configured SPA origin.
app.use(cors({
    origin: env.CLIENT_URL
}));
app.use(compression({
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
    }
}));
// Body size caps (SEC-08): admin problem create/update carry test cases and code, so they get a
// larger parser; everything else is limited to 100 KB. The /problem parser runs first, so the global
// one skips those requests. 5 MB fits a problem in the seed format (up to 10 tests of 200 KB input +
// 200 KB expected output, see backend/seed/FORMAT.md).
app.use("/problem", express.json({ limit: "5mb" }));
app.use(express.json({ limit: "100kb" }));
app.use(healthRouter);
app.use("/user", authRouter);
app.use("/problem", problemRouter);
app.use("/submission", submitRouter);
app.use("/admin", adminRouter);
app.use("/chatAI", chatAIRouter);

// Unknown routes
app.use((req, res) => {
  res.status(404).json(errorBody(404, "Route not found."));
});

// Central error handler (BUG-11, CQ-04): every error leaves as { error: { code, message } }.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // body-parser errors carry a type (entity.too.large -> 413, entity.parse.failed -> 400)
  if (err.type === "entity.too.large") {
    return res.status(413).json(errorBody(413, "Request body is too large."));
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json(errorBody(400, "Malformed JSON in request body.", "INVALID_JSON"));
  }
  if (err instanceof AppError) {
    return sendError(res, err);
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json(errorBody(500, "Something went wrong on the server."));
});

module.exports = app;
