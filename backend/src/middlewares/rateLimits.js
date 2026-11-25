// All rate limiters in one place (SEC-09, SEC-06). Counters live in Redis (rate-limit-redis), so they
// survive restarts and are shared by every instance. If Redis is down the limiters fail OPEN
// (passOnStoreError) rather than blocking all traffic; the outage is logged by the Redis client.
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const client = require("../config/redis");

const makeStore = (name) => {
  const store = new RedisStore({
    prefix: `rl:${name}:`,
    sendCommand: (...args) => client.sendCommand(args),
  });
  // The store loads its Lua scripts eagerly; when Redis is not connected yet (boot policy B1) those
  // promises reject. The store reloads the scripts on first use, so the early rejection is expected.
  store.incrementScriptSha?.catch?.(() => {});
  store.getScriptSha?.catch?.(() => {});
  return store;
};

const limiter = (name, options) =>
  rateLimit({
    standardHeaders: "draft-7",
    legacyHeaders: false,
    passOnStoreError: true,
    store: makeStore(name),
    ...options,
  });

const clientIp = (req) => ipKeyGenerator(req.ip || "");
const normalizedEmail = (req) =>
  typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase().slice(0, 254) : "";

// Registration: per IP (was shared with login before)
const registerLimiter = limiter("register", {
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: "Too many sign-up attempts from this network. Please try again later." },
});

// Login, layer 1: failed attempts per (IP, email). One attacked account cannot lock out others.
const loginEmailLimiter = limiter("login-email", {
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${clientIp(req)}|${normalizedEmail(req)}`,
  message: { message: "Too many failed sign-in attempts for this account. Please try again in 15 minutes." },
});

// Login, layer 2: overall attempts per IP (slows password spraying across many emails)
const loginIpLimiter = limiter("login-ip", {
  windowMs: 15 * 60 * 1000,
  limit: 50,
  message: { message: "Too many sign-in attempts from this network. Please try again later." },
});

const demoLimiter = limiter("demo", {
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: "Too many demo accounts created from this IP. Please try again in 15 minutes." },
});

const submitLimiter = limiter("submit", {
  windowMs: 15 * 60 * 1000,
  limit: 50,
  message: { message: "Too many submissions. Please wait a few minutes before trying again." },
});

// AI tutor: per user...
const aiUserLimiter = limiter("ai-user", {
  windowMs: 10 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.user?._id?.toString() || clientIp(req),
  message: { message: "Too many AI Tutor requests. You have reached the limit of 10 questions per 10 minutes. Please take a moment to review the hints before asking again." },
});

// ...and per IP, so minting many accounts from one IP does not multiply the Gemini budget (SEC-06)
const aiIpLimiter = limiter("ai-ip", {
  windowMs: 10 * 60 * 1000,
  limit: 20,
  message: { message: "Too many AI Tutor requests from this network. Please try again in a few minutes." },
});

module.exports = {
  registerLimiter,
  loginEmailLimiter,
  loginIpLimiter,
  demoLimiter,
  submitLimiter,
  aiUserLimiter,
  aiIpLimiter,
};
