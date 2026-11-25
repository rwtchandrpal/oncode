// Process entry point: connects MongoDB and Redis, starts the HTTP server, handles shutdown.
// The Express app itself lives in app.js.
const env = require("./config/env");
const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");
const client = require("./config/redis");
const { initDemoCleanupWorker } = require("./utils/cleanupDemoWorker");
const logger = require("./utils/logger");

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

