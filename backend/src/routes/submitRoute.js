const express = require('express');
const submitRouter = express.Router();

const userMiddleware = require('../middlewares/userMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const {submitCode, runCode} = require('../controllers/submissionController');
const {checkJudge0Health} = require('../utils/judge0Utility');
const rateLimit = require('express-rate-limit');

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Limit each IP to 50 code submissions per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many submissions. Please wait a few minutes before trying again.' }
});

// Judge0 diagnostic: admin-only, and the payload carries no host/port details (SEC-05)
submitRouter.get("/health", adminMiddleware, async (req, res) => {
  const health = await checkJudge0Health();
  const statusCode = health.isOnline ? 200 : 503;
  res.status(statusCode).json(health);
});

submitRouter.post("/submit/:id", userMiddleware, submitLimiter, submitCode);
submitRouter.post("/run/:id", userMiddleware, submitLimiter, runCode);


module.exports = submitRouter;