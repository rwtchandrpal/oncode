// Single JWT authentication module (CQ-03), replacing userMiddleware, adminMiddleware and
// optionalUserMiddleware, which were near-identical copies.
//
//   requireUser        - 401 unless a valid, non-revoked token for an existing user.
//                        A guest token gets 403 GUEST_NOT_ALLOWED (not 401, so the client keeps its guest session).
//   requireAdmin       - requireUser + the user's CURRENT role in MongoDB must be admin (403 otherwise)
//   requireUserOrGuest - a user (as requireUser) or a guest session. Guests get req.guest, never req.user.
//   optionalUser       - never rejects; sets req.user (or null) and req.guest (or null)
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { isTokenBlocked, JWT_ERROR_NAMES } = require("../utils/tokenBlocklist");
const { isGuestPayload, isValidGuestId } = require("../utils/guestSession");
const guestConfig = require("../config/guest");
const logger = require("../utils/logger");

class AuthFailure extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const GUEST_NOT_ALLOWED_MESSAGE = "Sign up or log in to use this feature.";

// Reads and verifies the Bearer token. Throws AuthFailure or a JWT error.
const readToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthFailure(401, "Authentication token is missing. Please log in.");
  }
  const token = authHeader.split(" ")[1];
  const payload = jwt.verify(token, process.env.JWT_KEY);
  return { token, payload };
};

// Resolves a user token to a user document.
const loadUser = async (token, payload) => {
  if (!payload?._id) {
    throw new AuthFailure(401, "Invalid token payload.");
  }

  // Fails open when Redis is down (BUG-04); see utils/tokenBlocklist.js
  if (await isTokenBlocked(token)) {
    throw new AuthFailure(401, "Session expired. Please log in again.");
  }

  // Re-read the user (and role) on every request instead of trusting the token's claims
  const user = await User.findById(payload._id).select("_id email role firstName lastName");
  if (!user) {
    throw new AuthFailure(401, "User account no longer exists.");
  }
  return user;
};

// Resolves a guest token to { id, expiresAt }. No database read: a guest has no document.
const loadGuest = async (token, payload) => {
  if (!guestConfig.enabled) {
    throw new AuthFailure(401, "Guest mode is currently unavailable. Please log in or sign up.", "GUEST_MODE_DISABLED");
  }
  if (!isValidGuestId(payload.gid)) {
    throw new AuthFailure(401, "Invalid token payload.");
  }
  if (await isTokenBlocked(token)) {
    throw new AuthFailure(401, "Your guest session has ended.", "GUEST_SESSION_ENDED");
  }
  return { id: payload.gid, expiresAt: new Date(payload.exp * 1000) };
};

// User-only resolution. A guest token (even one that also carries an _id) is never treated as a user.
const resolveUser = async (req) => {
  const { token, payload } = readToken(req);
  if (isGuestPayload(payload)) {
    throw new AuthFailure(403, GUEST_NOT_ALLOWED_MESSAGE, "GUEST_NOT_ALLOWED");
  }
  return loadUser(token, payload);
};

// User or guest resolution: { user, guest }, exactly one of them set.
const resolveUserOrGuest = async (req) => {
  const { token, payload } = readToken(req);
  if (isGuestPayload(payload)) {
    return { user: null, guest: await loadGuest(token, payload) };
  }
  return { user: await loadUser(token, payload), guest: null };
};

const handleFailure = (err, res) => {
  if (err instanceof AuthFailure) {
    return res.status(err.status).json({ message: err.message, ...(err.code ? { code: err.code } : {}) });
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
    req.guest = null;
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
    req.guest = null;
    next();
  } catch (err) {
    handleFailure(err, res);
  }
};

const requireUserOrGuest = async (req, res, next) => {
  try {
    const { user, guest } = await resolveUserOrGuest(req);
    req.user = user;
    req.guest = guest;
    next();
  } catch (err) {
    handleFailure(err, res);
  }
};

const optionalUser = async (req, res, next) => {
  try {
    const { user, guest } = await resolveUserOrGuest(req);
    req.user = user;
    req.guest = guest;
  } catch {
    // Missing, invalid, expired or revoked token -> continue anonymously
    req.user = null;
    req.guest = null;
  }
  next();
};

module.exports = { requireUser, requireAdmin, requireUserOrGuest, optionalUser };
