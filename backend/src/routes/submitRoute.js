const express = require('express');
const { requireAdmin, requireUserOrGuest } = require('../middlewares/authenticate');
const submitRouter = express.Router();

const {submitCode, runCode, getSubmissionById} = require('../controllers/submissionController');
const {checkJudge0Health} = require('../utils/judge0Utility');
const { submitLimiter, guestGlobalExecutionLimiter } = require('../middlewares/rateLimits');
const validate = require('../middlewares/validate');
const { idParams } = require('../validation/common');
const { executeBody } = require('../validation/submission');


// Judge0 diagnostic: admin-only, and the payload carries no host/port details (SEC-05)
submitRouter.get("/health", requireAdmin, async (req, res) => {
  const health = await checkJudge0Health();
  const statusCode = health.isOnline ? 200 : 503;
  res.status(statusCode).json(health);
});

// Users and guests. Guests also count against a global guest budget and a per-session quota (controller).
submitRouter.post("/submit/:id", requireUserOrGuest, validate({ params: idParams, body: executeBody }), submitLimiter, guestGlobalExecutionLimiter, submitCode);
// Owner-scoped submission detail (code + error message), fetched when a history row is expanded
submitRouter.get("/:id", requireUserOrGuest, validate({ params: idParams }), getSubmissionById);
submitRouter.post("/run/:id", requireUserOrGuest, validate({ params: idParams, body: executeBody }), submitLimiter, guestGlobalExecutionLimiter, runCode);


module.exports = submitRouter;