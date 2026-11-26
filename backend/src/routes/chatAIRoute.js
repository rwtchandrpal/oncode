const express = require('express');
const { requireUserOrGuest } = require('../middlewares/authenticate');
const { aiUserLimiter, aiIpLimiter } = require('../middlewares/rateLimits');
const chatAIRouter = express.Router();
const chatWithAI = require('../controllers/chatWithAI');
const validate = require('../middlewares/validate');
const { doubtBody } = require('../validation/ai');


// Users and guests (guests: 5 questions per guest session, see controllers/chatWithAI.js)
chatAIRouter.post('/doubt', requireUserOrGuest,validate({ body: doubtBody }), aiIpLimiter, aiUserLimiter, chatWithAI);

module.exports = chatAIRouter;