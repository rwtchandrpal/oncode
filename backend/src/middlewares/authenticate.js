// Single JWT authentication module (CQ-03), replacing userMiddleware, adminMiddleware and
// optionalUserMiddleware, which were near-identical copies.
//
//   requireUser  - 401 unless a valid, non-revoked token for an existing (non-expired demo) user
//   requireAdmin - requireUser + the user's CURRENT role in MongoDB must be admin (403 otherwise)
//   optionalUser - never rejects; sets req.user or null (guest-friendly routes)
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { isTokenBlocked, JWT_ERROR_NAMES } = require("../utils/tokenBlocklist");
const logger = require("../utils/logger");

class AuthFailure extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Resolves the Bearer token to a user document, or throws AuthFailure / a JWT error / an infra error.
const resolveUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthFailure(401, "Authentication token is missing. Please log in.");
  }
  const token = authHeader.split(" ")[1];

  const payload = jwt.verify(token, process.env.JWT_KEY);
  if (!payload?._id) {
    throw new AuthFailure(401, "Invalid token payload.");
  }

  // Fails open when Redis is down (BUG-04); see utils/tokenBlocklist.js
  if (await isTokenBlocked(token)) {
    throw new AuthFailure(401, "Session expired. Please log in again.");
  }

  // Re-read the user (and role) on every request instead of trusting the token's claims
  const user = await User.findById(payload._id).select("_id email role firstName lastName isDemo expiresAt");
  if (!user) {
    throw new AuthFailure(401, "User account no longer exists.");
  }
  if (user.isDemo && user.expiresAt && new Date() > user.expiresAt) {
    throw new AuthFailure(401, "Demo session expired. Please start a new demo session or sign up.");
  }
  return user;
};

const handleFailure = (err, res) => {
  if (err instanceof AuthFailure) {
    return res.status(err.status).json({ message: err.message });
  }
  if (JWT_ERROR_NAMES.has(err.name)) {
    const message = err.name === "TokenExpiredError" ? "Your session has expired. Please log in again." : "Authentication failed.";
    return res.status(401).json({ message });
  }
  // Infrastructure failure (e.g. MongoDB unreachable): not the user's fault, so no 401 that would
  // make the client throw away a valid token.
  logger.error({ err }, "[auth] middleware error");
  return res.status(503).json({ message: "Service temporarily unavailable. Please try again." });
};

const requireUser = async (req, res, next) => {
  try {
    req.user = await resolveUser(req);
    next();
  } catch (err) {
    handleFailure(err, res);
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    req.user = user;
    next();
  } catch (err) {
    handleFailure(err, res);
  }
};

const optionalUser = async (req, res, next) => {
  try {
    req.user = await resolveUser(req);
  } catch {
    // Missing, invalid, expired or revoked token -> continue as a guest
    req.user = null;
  }
  next();
};

module.exports = { requireUser, requireAdmin, optionalUser };
