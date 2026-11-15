const User = require("../models/user");
const Submission = require("../models/submission");
const Problem = require("../models/problem");
const validate = require("../utils/validate");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const client = require("../config/redis");
const crypto = require("crypto");

// handler for temporary isolated demo session
const demoLogin = async (req, res) => {
  try {
    const timestamp = Date.now();
    const entropy = crypto.randomBytes(4).toString("hex");
    const uniqueEmail = `demo_${timestamp}_${entropy}@guest.oncode.local`;
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    const expiresAt = new Date(timestamp + 24 * 60 * 60 * 1000); // 24-hour expiration

    const demoUser = await User.create({
      firstName: "Demo",
      lastName: "Guest",
      email: uniqueEmail,
      password: hashedPassword,
      role: "user",
      isDemo: true,
      expiresAt: expiresAt
    });

    const token = jwt.sign(
      { _id: demoUser._id, email: demoUser.email, role: "user", isDemo: true },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );

    const userData = {
      _id: demoUser._id,
      firstName: demoUser.firstName,
      lastName: demoUser.lastName,
      email: demoUser.email,
      role: demoUser.role,
      isDemo: true,
      expiresAt: demoUser.expiresAt
    };

    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache'
    });

    res.status(201).json({
      message: "Demo session initialized successfully.",
      user: userData,
      token
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to initialize demo session: " + err.message });
  }
};

// cookieOptions are no longer needed as we use localStorage + Bearer tokens

// handler for authentication register, login, logout
const register = async (req, res) => {
  try {
    // validate data
    validate(req.body);
    const { firstName, email, password } = req.body;

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

    res.status(400).json({ message: "Registration failed: " + err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide both email and password." });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
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
    res.status(500).json({ message: "Login failed: " + err.message });
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
    res.status(503).json({ message: "Logout failed: " + err.message });
  }
};

const adminRegister = async (req, res) => {
  // this is route through which admin can register new admin or user
  try {
    // validate data
    validate(req.body);
    const { firstName, email, password, role} = req.body;

    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = role || "user";
    
    const user = await User.create(req.body);
    res.status(201).json({ message: "Registered successfully." });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    res.status(400).json({ message: "Registration failed." + err.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    if (req.user.isDemo) {
      return res.status(403).json({
        message: "Demo sessions are temporary and cannot be manually deleted. They expire automatically after 24 hours."
      });
    }

    const userId = req.user._id;

    await User.findByIdAndDelete(userId);

    // Token should ideally be blacklisted here too, but frontend will clear localStorage

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete profile." });
  }
};

const checkAuth = async (req, res) => {
  const reply = {
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    _id: req.user._id,
    role: req.user.role,
    isDemo: req.user.isDemo || false,
    expiresAt: req.user.expiresAt || null
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
        .catch(err => console.error("Self-healing cleanup error:", err.message));
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

    const totalSubmissions = await Submission.countDocuments({ userId });
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
    console.error("Error fetching user stats:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch user statistics: " + error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  demoLogin,
  adminRegister,
  deleteProfile,
  checkAuth,
  getUserStats,
};
