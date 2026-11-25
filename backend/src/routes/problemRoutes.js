const express = require('express');
const adminMiddleware = require('../middlewares/adminMiddleware');
const userMiddleware = require('../middlewares/userMiddleware');
const optionalUserMiddleware = require('../middlewares/optionalUserMiddleware');
const validate = require('../middlewares/validate');
const { idParams } = require('../validation/common');
const { createProblemBody, updateProblemBody, listProblemsQuery } = require('../validation/problem');
const {createProblem, updateProblem,deleteProblem, getAllProblems, getSolvedProblems, getProblem, getProblemSolution, getAllSubmissions} = require('../controllers/problemController');


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
problemRouter.get("/:id/solution", userMiddleware, validate({ params: idParams }), getProblemSolution);
problemRouter.get("/submissions/:id", userMiddleware, validate({ params: idParams }), getAllSubmissions);

module.exports = problemRouter ;