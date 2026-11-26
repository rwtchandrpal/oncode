const express = require('express');
const { optionalUser, requireAdmin, requireUser, requireUserOrGuest } = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const { idParams } = require('../validation/common');
const { createProblemBody, updateProblemBody, listProblemsQuery, listSubmissionsQuery } = require('../validation/problem');
const {createProblem, updateProblem,deleteProblem, getAllProblems, getSolvedProblems, getProblem, getProblemForAdmin, getProblemSolution, getAllSubmissions} = require('../controllers/problemController');


const problemRouter = express.Router();

// create , fetch, update , delete 

// only admin can post, put, delete
problemRouter.post("/", requireAdmin, validate({ body: createProblemBody }), createProblem);
problemRouter.put("/:id", requireAdmin, validate({ params: idParams, body: updateProblemBody }), updateProblem);
problemRouter.delete("/:id", requireAdmin, validate({ params: idParams }), deleteProblem);

// public problem listing with optional authentication for solved status
problemRouter.get("/", optionalUser, validate({ query: listProblemsQuery }), getAllProblems);
problemRouter.get("/solved", requireUser, getSolvedProblems);
// Users and guests (guests see only their current session's submissions; solutions stay locked for them)
problemRouter.get("/:id", requireUserOrGuest, validate({ params: idParams }), getProblem);
// Admin only: includes hidden test cases, driver code and reference solutions (edit form prefill)
problemRouter.get("/:id/admin", requireAdmin, validate({ params: idParams }), getProblemForAdmin);
problemRouter.get("/:id/solution", requireUserOrGuest, validate({ params: idParams }), getProblemSolution);
problemRouter.get("/submissions/:id", requireUserOrGuest, validate({ params: idParams, query: listSubmissionsQuery }), getAllSubmissions);

module.exports = problemRouter ;