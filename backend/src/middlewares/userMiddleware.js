const jwt = require("jsonwebtoken");
const User = require("../models/user");
const client = require("../config/redis");

// verify user is valid and logged in
const userMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Authentication token is missing. Please log in." });
    }
    const token = authHeader.split(" ")[1];

    // verify token
    const payload = jwt.verify(token, process.env.JWT_KEY);

    const { _id } = payload;
    if (!_id) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    // check in redis blockList
    const isBlocked = await client.exists(`token:${token}`);
    if (isBlocked) {
      return res
        .status(401)
        .json({ message: "Session expired. Please log in again." });
    }

    const user = await User.findById(_id).select('_id email role firstName lastName isDemo expiresAt');
    if (!user) {
      return res
        .status(401)
        .json({ message: "User account no longer exists." });
    }

    // Check if demo session has expired
    if (user.isDemo && user.expiresAt && new Date() > user.expiresAt) {
      return res
        .status(401)
        .json({ message: "Demo session expired. Please start a new demo session or sign up." });
    }

    req.user = user;
    next();
  } catch (err) {
    const errorMessage =
      err.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Authentication failed.";

    res.status(401).json({ message: errorMessage });
  }
};

module.exports = userMiddleware;
