// Must be first: loads .env and validates every variable, exiting with the missing names (CQ-02).
const env = require("./config/env");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require('cors');
const compression = require("compression");


const connectDB = require("./config/db");
const client = require("./config/redis");
const authRouter = require("./routes/userAuth");
const problemRouter = require("./routes/problemRoutes");
const submitRouter = require("./routes/submitRoute");
const adminRouter = require('./routes/adminRoutes');
const chatAIRouter = require('./routes/chatAIRoute');
const { initDemoCleanupWorker } = require("./utils/cleanupDemoWorker");
const logger = require("./utils/logger");
const pinoHttp = require("pino-http");
const errorShape = require("./middlewares/errorShape");
const { AppError, sendError, errorBody } = require("./utils/AppError");


const app = express();

// Normalize every error body to { error: { code, message } } (CQ-04)
app.use(errorShape);

// Request logging with redacted Authorization header (CQ-06)
app.use(pinoHttp({
  logger,
  customLogLevel: (req, res, err) => (err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info"),
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url, headers: { authorization: req.headers.authorization } }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
}));

app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true
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
app.use(cookieParser());
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
  app.listen(PORT, () => {
    logger.info("Server in listening at port : " + PORT);
  });
};

initializeConnection();

