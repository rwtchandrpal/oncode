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


const app = express();

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

app.use((err, req, res, next) => {
  // body-parser errors carry a 4xx status (entity.too.large -> 413, entity.parse.failed -> 400)
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  console.error("Global Error:", err);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server."
  });
});

// Boot policy (BUG-03): MongoDB is required, so a failed connect exits non-zero and a supervisor can
// restart us. Redis is degradable (token blocklist, demo quotas): we start listening right away and
// connect Redis in the background; node-redis keeps retrying with backoff until it is reachable.
const initializeConnection = async () => {
  try {
    await connectDB();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }

  client.connect()
    .then(() => console.log("Redis connected"))
    .catch((error) => console.warn("Redis unavailable at boot; continuing in degraded mode:", error.code || error.message));

  initDemoCleanupWorker();

  const PORT = env.PORT;
  app.listen(PORT, () => {
    console.log("Server in listening at port : " + PORT);
  });
};

initializeConnection();

