// Must be first: loads .env and validates every variable, exiting with the missing names (CQ-02).
const env = require("./config/env");
const express = require("express");
const cors = require('cors');
const compression = require("compression");
const helmet = require("helmet");


const connectDB = require("./config/db");
const client = require("./config/redis");
const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemRoutes");
const submitRouter = require("./routes/submitRoute");
const adminRouter = require('./routes/adminRoutes');
const chatAIRouter = require('./routes/chatAIRoute');
const healthRouter = require("./routes/healthRoutes");
const mongoose = require("mongoose");
const { initDemoCleanupWorker } = require("./utils/cleanupDemoWorker");
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
// one skips those requests.
app.use("/problem", express.json({ limit: "2mb" }));
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

// Boot policy (BUG-03): MongoDB is required, so a failed connect exits non-zero and a supervisor can
// restart us. Redis is degradable (token blocklist, demo quotas): we start listening right away and
// connect Redis in the background; node-redis keeps retrying with backoff until it is reachable.
const initializeConnection = async () => {
  try {
    await connectDB();
    logger.info("MongoDB connected");
  } catch (error) {
    logger.fatal({ err: error }, "MongoDB connection failed");
    process.exit(1);
  }

  client.connect()
    .then(() => logger.info("Redis connected"))
    .catch((error) => logger.warn({ code: error.code || error.message }, "Redis unavailable at boot; continuing in degraded mode"));

  initDemoCleanupWorker();

  const PORT = env.PORT;
  const server = app.listen(PORT, () => {
    logger.info("Server in listening at port : " + PORT);
  });
  registerShutdown(server);
};

// Graceful shutdown (OPS-02): stop accepting connections, let in-flight requests finish, close Redis
// and MongoDB, exit 0. A 10 s watchdog forces exit 1 if something hangs.
const SHUTDOWN_TIMEOUT_MS = 10000;
const registerShutdown = (server) => {
  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down");
    const watchdog = setTimeout(() => {
      logger.error("Shutdown timed out; forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    watchdog.unref();
    try {
      await new Promise((resolve) => server.close(resolve));
      if (client.isOpen) await client.close().catch((err) => logger.warn({ err }, "Redis close failed"));
      await mongoose.disconnect();
      logger.info("Shutdown complete");
      clearTimeout(watchdog);
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

initializeConnection();

