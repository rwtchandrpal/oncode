const express = require('express');
const { requireUser } = require('../middlewares/authenticate');
const { aiUserLimiter, aiIpLimiter } = require('../middlewares/rateLimits');
const chatAIRouter = express.Router();
const chatWithAI = require('../controllers/chatWithAI');
const validate = require('../middlewares/validate');
const { doubtBody } = require('../validation/ai');


chatAIRouter.post('/doubt', requireUser, validate({ body: doubtBody }), aiIpLimiter, aiUserLimiter, chatWithAI);

module.exports = chatAIRouter;