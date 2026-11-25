const express = require('express');
const { requireAdmin, requireUser } = require('../middlewares/authenticate');
const submitRouter = express.Router();

const {submitCode, runCode, getSubmissionById} = require('../controllers/submissionController');
const {checkJudge0Health} = require('../utils/judge0Utility');
const { submitLimiter } = require('../middlewares/rateLimits');
const validate = require('../middlewares/validate');
const { idParams } = require('../validation/common');
const { executeBody } = require('../validation/submission');


// Judge0 diagnostic: admin-only, and the payload carries no host/port details (SEC-05)
submitRouter.get("/health", requireAdmin, async (req, res) => {
  const health = await checkJudge0Health();
  const statusCode = health.isOnline ? 200 : 503;
  res.status(statusCode).json(health);
});

submitRouter.post("/submit/:id", requireUser, validate({ params: idParams, body: executeBody }), submitLimiter, submitCode);
// Owner-scoped submission detail (code + error message), fetched when a history row is expanded
submitRouter.get("/:id", requireUser, validate({ params: idParams }), getSubmissionById);
submitRouter.post("/run/:id", requireUser, validate({ params: idParams, body: executeBody }), submitLimiter, runCode);


module.exports = submitRouter;