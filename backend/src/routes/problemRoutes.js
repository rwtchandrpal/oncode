const express = require('express');
const adminMiddleware = require('../middlewares/adminMiddleware');
const userMiddleware = require('../middlewares/userMiddleware');
const optionalUserMiddleware = require('../middlewares/optionalUserMiddleware');
const validate = require('../middlewares/validate');
const { idParams } = require('../validation/common');
const { createProblemBody, updateProblemBody, listProblemsQuery, listSubmissionsQuery } = require('../validation/problem');
const {createProblem, updateProblem,deleteProblem, getAllProblems, getSolvedProblems, getProblem, getProblemForAdmin, getProblemSolution, getAllSubmissions} = require('../controllers/problemController');


const problemRouter = express.Router();

// create , fetch, update , delete 

// only admin can post, put, delete
problemRouter.post("/", adminMiddleware, validate({ body: createProblemBody }), createProblem);
problemRouter.put("/:id", adminMiddleware, validate({ params: idParams, body: updateProblemBody }), updateProblem);
problemRouter.delete("/:id", adminMiddleware, validate({ params: idParams }), deleteProblem);

// public problem listing with optional authentication for solved status
problemRouter.get("/", optionalUserMiddleware, validate({ query: listProblemsQuery }), getAllProblems);
problemRouter.get("/solved", userMiddleware, getSolvedProblems);
problemRouter.get("/:id", userMiddleware, validate({ params: idParams }), getProblem);
// Admin only: includes hidden test cases, driver code and reference solutions (edit form prefill)
problemRouter.get("/:id/admin", adminMiddleware, validate({ params: idParams }), getProblemForAdmin);
problemRouter.get("/:id/solution", userMiddleware, validate({ params: idParams }), getProblemSolution);
problemRouter.get("/submissions/:id", userMiddleware, validate({ params: idParams, query: listSubmissionsQuery }), getAllSubmissions);

module.exports = problemRouter ;