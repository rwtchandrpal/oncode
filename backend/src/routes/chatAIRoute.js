const express = require('express');
const { aiUserLimiter, aiIpLimiter } = require('../middlewares/rateLimits');
const chatAIRouter = express.Router();
const userMiddleware = require('../middlewares/userMiddleware');
const chatWithAI = require('../controllers/chatWithAI');
const validate = require('../middlewares/validate');
const { doubtBody } = require('../validation/ai');


chatAIRouter.post('/doubt', userMiddleware, validate({ body: doubtBody }), aiIpLimiter, aiUserLimiter, chatWithAI);

module.exports = chatAIRouter;