const jwt = require("jsonwebtoken");
const User = require("../models/user");
const client = require("../config/redis");

/**
 * Optional User Authentication Middleware
 * 
 * If a valid Bearer token is provided, populates `req.user` with the user document.
 * If token is missing, invalid, expired, or blacklisted, gracefully sets `req.user = null`
 * and allows the request to continue. Never halts request execution with 401.
 */
const optionalUserMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      req.user = null;
      return next();
    }

    // Verify JWT signature and expiration
    const payload = jwt.verify(token, process.env.JWT_KEY);
    const { _id } = payload;
    if (!_id) {
      req.user = null;
      return next();
    }

    // Check Redis blacklist
    try {
      const isBlocked = await client.exists(`token:${token}`);
      if (isBlocked) {
        req.user = null;
        return next();
      }
    } catch (redisErr) {
      console.warn("Redis check failed in optionalUserMiddleware:", redisErr.message);
    }

    // Lookup user in MongoDB
    const user = await User.findById(_id).select('_id email role firstName lastName isDemo expiresAt');
    if (!user) {
      req.user = null;
      return next();
    }

    // Check if demo session has expired
    if (user.isDemo && user.expiresAt && new Date() > user.expiresAt) {
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (err) {
    // Token is invalid, expired, or malformed -> proceed as guest
    req.user = null;
    next();
  }
};

module.exports = optionalUserMiddleware;
