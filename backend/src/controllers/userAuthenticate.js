const User = require("../models/user");
const mongoose = require("mongoose");
const Submission = require("../models/submission");
const { UNGRADED_STATUSES } = Submission;
const Problem = require("../models/problem");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const client = require("../config/redis");
const crypto = require("crypto");
const { AppError, sendError } = require("../utils/AppError");
const logger = require('../utils/logger');
const guestConfig = require("../config/guest");
const { signGuestToken } = require("../utils/guestSession");

// Starts a guest session: a short-lived signed token, no user document and no saved progress.
const startGuestSession = (req, res) => {
  if (!guestConfig.enabled) {
    return res.status(503).json({
      message: "Guest mode is currently unavailable. Please sign up or log in.",
      code: "GUEST_MODE_DISABLED",
    });
  }
  const { token, expiresAt } = signGuestToken();
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache'
  });
  res.status(201).json({
    message: "Guest session started.",
    guest: { expiresAt },
    token,
  });
};

// handler for authentication register, login, logout
const register = async (req, res) => {
  try {
    // req.body was validated and normalized by validate({ body: registerBody | adminRegisterBody })
    const { password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);
    // make this route is only for user role
    req.body.role = "user";

    // check for uniqueness of email -> mogoose will throw error automatically
    const user = await User.create(req.body);

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: "user" },
      process.env.JWT_KEY,
      { expiresIn: "1h" },
    );

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      _id: user._id,
      role: user.role,
    };

    res.status(201).json({
      user: userData,
      token,
      message: "Registered Successfully",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email is already registered." });
    }
    if (err instanceof AppError) return sendError(res, err);
    if (err.name === "ValidationError") {
      logger.warn({ err }, "Register rejected");
      return res.status(400).json({ message: "Invalid registration data." });
    }
    sendError(res, err, "Registration failed. Please try again.");
  }
};

// bcrypt hash of a random throwaway value. Compared against when the email is unknown so that
// "no such user" and "wrong password" take the same time (SEC-10).
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), 10);

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Only plain strings are accepted. Objects such as {"$ne": null} would otherwise reach the
    // MongoDB filter as query operators (SEC-01).
    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res
        .status(400)
        .json({ message: "Please provide both email and password." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    // Always run bcrypt, even for unknown emails, to avoid a timing side channel.
    const isMatched = await bcrypt.compare(password, user ? user.password : DUMMY_PASSWORD_HASH);
    if (!user || !isMatched) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const userData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      _id: user._id,
      role: user.role,
    };

    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "1h" },
    );

    res.status(200).json({
      user: userData,
      token,
      message: "Logged in successfully",
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication token missing." });
    }
    const token = authHeader.split(" ")[1];

    const payload = jwt.decode(token);

    if (payload && payload.exp) {
      // add it to redis blacklist until it expired
      await client.set(`token:${token}`, "Blocked");
      await client.expireAt(`token:${token}`, payload.exp);
    }

    res.status(200).json({ message: "Logged out successfully." });
  } catch (err) {
    sendError(res, err, "Logout failed. Please try again.", 503);
  }
};

const adminRegister = async (req, res) => {
  // this is route through which admin can register new admin or user
  try {
    // req.body was validated and normalized by validate({ body: registerBody | adminRegisterBody })
    const { password, role } = req.body;

    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = role || "user";
    
    await User.create(req.body);
    res.status(201).json({ message: "Registered successfully." });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email is already registered." });
    }
    if (err instanceof AppError) return sendError(res, err);
    if (err.name === "ValidationError") {
      logger.warn({ err }, "Admin register rejected");
      return res.status(400).json({ message: "Invalid registration data." });
    }
    sendError(res, err, "Registration failed. Please try again.");
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndDelete(userId);

    // Token should ideally be blacklisted here too, but frontend will clear localStorage

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    sendError(res, err, "Failed to delete profile.");
  }
};

const checkAuth = async (req, res) => {
  const reply = {
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    _id: req.user._id,
    role: req.user.role,
  };
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache'
  });
  res.status(200).json({
    user: reply,
    message: "valid user session.",
  });
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // We only fetch the 'difficulty' field
    const user = await User.findById(userId).populate({
      path: "problemsSolved",
      select: "difficulty",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Defensive check: filter out nulls caused by legacy deleted problems
    const rawSolved = user.problemsSolved || [];
    const validProblems = rawSolved.filter(Boolean);

    // Self-healing: if dangling nulls were found, clean the user's array in the background
    if (validProblems.length !== rawSolved.length) {
      const validIds = validProblems.map(p => p._id);
      User.updateOne({ _id: userId }, { $set: { problemsSolved: validIds } })
        .catch(err => logger.error({ err }, "Self-healing cleanup error"));
    }

    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    validProblems.forEach((problem) => {
      const diff = problem?.difficulty?.toLowerCase();
      if (diff === "easy") easySolved++;
      else if (diff === "medium") mediumSolved++;
      else if (diff === "hard") hardSolved++;
    });

    const totalSolved = easySolved + mediumSolved + hardSolved;

    // Platform difficulty totals for accurate progress calculation
    const platformCounts = await Problem.aggregate([
      { $group: { _id: { $toLower: "$difficulty" }, count: { $sum: 1 } } }
    ]);
    const totalEasy = platformCounts.find(p => p._id === 'easy')?.count || 0;
    const totalMedium = platformCounts.find(p => p._id === 'medium')?.count || 0;
    const totalHard = platformCounts.find(p => p._id === 'hard')?.count || 0;
    const totalPlatformProblems = totalEasy + totalMedium + totalHard;

    // Only graded submissions count; Pending / System Error never had a verdict (BUG-13)
    const totalSubmissions = await Submission.countDocuments({ userId, status: mongoose.trusted({ $nin: UNGRADED_STATUSES }) });
    const acceptedSubmissions = await Submission.countDocuments({
      userId,
      status: "Accepted",
    });

    let acceptanceRate = 0;
    if (totalSubmissions > 0) {
      acceptanceRate = Math.round(
        (acceptedSubmissions / totalSubmissions) * 100,
      );
    }

    const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache'
    });

    res.status(200).json({
      message: "User statistics fetched successfully",
      stats: {
        easySolved,
        mediumSolved,
        hardSolved,
        totalSolved,
        totalEasy,
        totalMedium,
        totalHard,
        totalPlatformProblems,
        totalSubmissions,
        acceptedSubmissions,
        acceptanceRate,
        joinDate,
      },
    });
  } catch (error) {
    sendError(res, error, "Failed to fetch user statistics.");
  }
};

module.exports = {
  register,
  login,
  logout,
  startGuestSession,
  adminRegister,
  deleteProfile,
  checkAuth,
  getUserStats,
};
