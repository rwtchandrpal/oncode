const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { isTokenBlocked, JWT_ERROR_NAMES } = require("../utils/tokenBlocklist");

const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const token = authHeader.split(" ")[1];

    // verify token
    const payload = jwt.verify(token, process.env.JWT_KEY);

    const { _id } = payload;
    if (!_id) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    // check in redis blockList
    const isBlocked = await isTokenBlocked(token);
    if (isBlocked) {
      return res
        .status(401)
        .json({ message: "Session expired. Please log in again." });
    }

    const user = await User.findById(_id).select('_id email role firstName lastName');
    if (!user) {
      return res
        .status(401)
        .json({ message: "User account no longer exists." });
    }

    // Fixed: Check the real-time DB role, not the stale JWT role.
    // Fixed: Return 403 Forbidden.
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin privileges required." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (JWT_ERROR_NAMES.has(err.name)) {
      const errorMessage =
        err.name === "TokenExpiredError"
          ? "Your session has expired. Please log in again."
          : "Authentication failed.";
      return res.status(401).json({ message: errorMessage });
    }
    // Infrastructure failure (e.g. MongoDB unreachable): not the user's fault, so no 401 that would
    // make the client throw away a valid token.
    console.error("[auth] middleware error:", err);
    res.status(503).json({ message: "Service temporarily unavailable. Please try again." });
  }
};

module.exports = adminMiddleware;
