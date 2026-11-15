const express = require('express');
const adminMiddleware = require('../middlewares/adminMiddleware');
const userMiddleware = require('../middlewares/userMiddleware');
const optionalUserMiddleware = require('../middlewares/optionalUserMiddleware');
const {createProblem, updateProblem,deleteProblem, getAllProblems, getSolvedProblems, getProblem, getProblemSolution, getAllSubmissions} = require('../controllers/problemController');


const problemRouter = express.Router();

// create , fetch, update , delete 

// only admin can post, put, delete
problemRouter.post("/", adminMiddleware, createProblem);
problemRouter.put("/:id", adminMiddleware, updateProblem);
problemRouter.delete("/:id", adminMiddleware, deleteProblem);

// public problem listing with optional authentication for solved status
problemRouter.get("/", optionalUserMiddleware, getAllProblems);
problemRouter.get("/solved", userMiddleware, getSolvedProblems);
problemRouter.get("/:id", userMiddleware, getProblem);
problemRouter.get("/:id/solution", userMiddleware, getProblemSolution);
problemRouter.get("/submissions/:id", userMiddleware, getAllSubmissions);

module.exports = problemRouter ;