const express = require('express');
const rateLimit = require('express-rate-limit');
const chatAIRouter = express.Router();
const userMiddleware = require('../middlewares/userMiddleware');
const chatWithAI = require('../controllers/chatWithAI');

const aiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  limit: 10, // Limit each user to 10 AI requests per 10 minutes
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  },
  validate: {
    keyGeneratorIpFallback: false
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    message: "Too many AI Tutor requests. You have reached the limit of 10 questions per 10 minutes. Please take a moment to review the hints before asking again."
  }
});

chatAIRouter.post('/doubt', userMiddleware, aiRateLimiter, chatWithAI);

module.exports = chatAIRouter;