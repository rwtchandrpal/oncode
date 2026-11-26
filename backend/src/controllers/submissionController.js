const mongoose = require('mongoose');
const Problem = require('../models/problem');
const User = require('../models/user');
const Submission = require('../models/submission');
const GuestSubmission = require('../models/guestSubmission');
const { takeGuestExecution, refundGuestQuota } = require('../utils/guestSession');
const { getLanguageId, getstatusById } = require('../utils/judge0Utility');
const judgeService = require('../services/judgeService');
const { sendError } = require('../utils/AppError');
const logger = require('../utils/logger');
const { decodeBase64 } = require('../utils/base64');

// Largest accepted source file (SEC-08). Checked before any DB write.
const MAX_CODE_LENGTH = 64000;
const codeTooLarge = (code) => typeof code === "string" && code.length > MAX_CODE_LENGTH;

// Helper to prevent giant strings from crashing the DB or UI
const truncateString = (str, maxLength = 2000) => {
    if (!str) return "";
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + "\n... [Output truncated due to length]";
};

// The only submission fields a user ever sees for a graded (hidden-test) submission.
const toPublicSubmission = (s) => ({
    _id: s._id,
    problemId: s.problemId,
    language: s.language,
    status: s.status,
    testCasesPassed: s.testCasesPassed,
    testCasesTotal: s.testCasesTotal,
    runtime: s.runtime,
    memory: s.memory,
    errorMessage: s.errorMessage || null,
    createdAt: s.createdAt
});

// Turns Judge0 results for the hidden tests into a verdict. Grading stops at the first failure.
const gradeResults = (testResult, testCases) => {
    // Reported runtime is the slowest test, not the sum of all tests (BUG-18)
    let maxRuntimeSeconds = 0;
    let maxMemoryKb = 0;
    let statusId = 3; // Default to Accepted
    let testCasesPassed = 0;
    // User-safe message (compile output, or a generic line for runtime errors)
    let errorMessage = null;
    // Full diagnostics, stored for admins only (never returned to the user)
    let errorDetail = null;
    let failedTestCase = null;

    for (let i = 0; i < testResult.length; i++) {
        const test = testResult[i];

        if (test.status_id !== 3) {
            statusId = test.status_id;

            failedTestCase = {
                input: truncateString(testCases[i].input),
                expectedOutput: truncateString(testCases[i].expectedOutput),
                actualOutput: truncateString(decodeBase64(test.stdout))
            };

            if (test.status_id === 6) {
                // Compilation errors do not depend on test input, so the compiler output is safe to show.
                errorMessage = truncateString(decodeBase64(test.compile_output) || "Compilation failed.");
                errorDetail = errorMessage;
            } else if (test.status_id !== 4) {
                // Runtime errors / TLE on a hidden test: stderr could echo the hidden input (SEC-03).
                errorDetail = truncateString(decodeBase64(test.stderr) || decodeBase64(test.compile_output) || "");
                errorMessage = test.status_id === 5 ? null : `${getstatusById(test.status_id)} on hidden test case ${i + 1}.`;
            }
            break; // Stop grading after the first failure
        }

        maxRuntimeSeconds = Math.max(maxRuntimeSeconds, parseFloat(test.time || 0));
        maxMemoryKb = Math.max(maxMemoryKb, test.memory || 0);
        testCasesPassed++;
    }

    return {
        statusId,
        status: getstatusById(statusId),
        testCasesPassed,
        errorMessage,
        errorDetail,
        failedTestCase,
        runtime: Math.round(maxRuntimeSeconds * 1000),
        memory: parseFloat((maxMemoryKb / 1024).toFixed(1)),
    };
};

// Guest submit (docs/GUEST_MODE_DESIGN.md): charged to the session quota, graded like a user's, and
// stored only in the expiring guestsubmissions collection. Never touches submissions or problemsSolved.
// The record is written once, after the verdict, so a Judge0 failure leaves nothing behind.
const submitAsGuest = async (req, res, { problemId, code, language, snippet, testCases }) => {
    const quotaKey = await takeGuestExecution(req.guest);
    let testResult;
    try {
        testResult = await judgeService.runBatch({ language, driverCode: snippet.driverCode, code, testCases });
    } catch (execErr) {
        await refundGuestQuota(quotaKey);
        throw execErr;
    }

    const graded = gradeResults(testResult, testCases);
    const saved = await GuestSubmission.create({
        guestId: req.guest.id,
        problemId,
        code,
        language,
        status: graded.status,
        testCasesPassed: graded.testCasesPassed,
        testCasesTotal: testCases.length,
        runtime: graded.runtime,
        memory: graded.memory,
        errorMessage: graded.errorMessage,
        expiresAt: req.guest.expiresAt
    });

    res.status(201).json({
        message: "Submission completed.",
        submissionResult: toPublicSubmission(saved)
    });
};

// ==========================================
// SUBMIT CODE (Grades all hidden test cases)
// ==========================================
const submitCode = async (req, res) => {
    try {
        const problemId = req.params.id;
        const { code, language } = req.body;

        if (codeTooLarge(code)) {
            return res.status(413).json({ message: "Code is too large (max 64,000 characters)." });
        }
        if (!problemId || typeof code !== "string" || !code || typeof language !== "string" || !language) {
            return res.status(400).json({ message: "Missing required field." });
        }

        const problem = await Problem.findById(problemId);
        if(!problem) {
            return res.status(404).json({ message: "Problem not found." });
        }

        // Validate Language & Get Driver Code
        const snippet = problem.codeSnippets.find(s => s.language.toLowerCase() === language.toLowerCase());
        if (!snippet) {
            return res.status(400).json({ message: `Language '${language}' is not supported for this problem.` });
        }
        getLanguageId(language.toLowerCase()); // throws a 400 AppError for unsupported languages
        const testCases = problem.hiddenTestCases || [];

        if (req.guest) {
            return await submitAsGuest(req, res, { problemId, code, language, snippet, testCases });
        }
        const userId = req.user._id;

        // The submission record is created only once Judge0 has accepted the batch, and is marked
        // 'System Error' if polling then fails, so an outage never leaves a 'Pending' record (BUG-01).
        let submittedResult = null;
        let testResult;
        try {
            const batch = await judgeService.startBatch({ language, driverCode: snippet.driverCode, code, testCases });
            submittedResult = await Submission.create({
                userId, problemId, code, language,
                testCasesPassed: 0,
                status: 'Pending',
                testCasesTotal: testCases.length
            });
            testResult = await judgeService.awaitBatch(batch);
        } catch (execErr) {
            if (submittedResult) {
                submittedResult.status = 'System Error';
                submittedResult.errorMessage = 'Execution service unavailable';
                await submittedResult.save().catch((saveErr) => logger.error({ err: saveErr }, "Failed to mark submission as System Error"));
            }
            throw execErr;
        }

        const graded = gradeResults(testResult, testCases);
        submittedResult.status = graded.status;
        submittedResult.testCasesPassed = graded.testCasesPassed;
        submittedResult.errorMessage = graded.errorMessage;
        submittedResult.errorDetail = graded.errorDetail;
        submittedResult.failedTestCase = graded.failedTestCase;
        submittedResult.runtime = graded.runtime;
        submittedResult.memory = graded.memory;

        await submittedResult.save();

        if(graded.statusId === 3){
            await User.findByIdAndUpdate(userId, {
                $addToSet: { problemsSolved: problemId }
            });
        }

        // Whitelisted response: no hidden input/expected output, no stderr, no driver code (SEC-03).
        res.status(201).json({
            message: "Submission completed.",
            submissionResult: toPublicSubmission(submittedResult)
        });
    } catch(err) {
        // Judge0 failures arrive as Judge0UnavailableError (503, generic message); anything else is a 500.
        sendError(res, err, "Failed to submit code. Please try again.");
    }
};

// ==========================================
// RUN CODE (Tests only the visible test case)
// ==========================================
const runCode = async (req, res) => {
    try {
        const problemId = req.params.id;
        const { code, language } = req.body;

        if (codeTooLarge(code)) {
            return res.status(413).json({ message: "Code is too large (max 64,000 characters)." });
        }
        if (!problemId || typeof code !== "string" || !code || typeof language !== "string" || !language) {
            return res.status(400).json({ message: "Some fields are missing" });
        }

        const problem = await Problem.findById(problemId);
        if(!problem) {
            return res.status(404).json({ message: "Problem not found." });
        }

        // Validate Language & Get Driver Code
        const snippet = problem.codeSnippets.find(s => s.language.toLowerCase() === language.toLowerCase());
        if (!snippet) {
            return res.status(400).json({ message: `Language '${language}' is not supported for this problem.` });
        }
        
        const testCase = problem.visibleTestCase;
        getLanguageId(language.toLowerCase()); // throws a 400 AppError for unsupported languages

        // The guest quota is charged only for valid requests (BUG-14)
        const guestQuotaKey = req.guest ? await takeGuestExecution(req.guest) : null;

        let result;
        try {
            const [first] = await judgeService.runBatch({ language, driverCode: snippet.driverCode, code, testCases: [testCase] });
            result = first;
        } catch (execErr) {
            await refundGuestQuota(guestQuotaKey);
            throw execErr;
        }
        
        res.status(200).json({
            message: "Run completed.",
            status: getstatusById(result.status_id),
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: truncateString(decodeBase64(result.stdout)),
            errorMessage: truncateString(decodeBase64(result.compile_output) || decodeBase64(result.stderr) || ""),
            runtime: result.time ? Math.round(parseFloat(result.time) * 1000) : 0,
            memory: result.memory ? (result.memory / 1024).toFixed(1) : 0
        });

    } catch(error) {
        sendError(res, error, "Failed to run code. Please try again.");
    }
};

// ==========================================
// GET ONE SUBMISSION (owner only, PERF-02)
// ==========================================
const getSubmissionById = async (req, res) => {
    try {
        // Scoped to the caller: another user's id answers 404, not 403, so ids cannot be probed.
        // Guests only ever see their own, unexpired guest submissions (a separate collection).
        const fields = '_id problemId status testCasesPassed testCasesTotal runtime memory language createdAt errorMessage code';
        const submission = req.guest
            ? await GuestSubmission.findOne({
                _id: req.params.id,
                guestId: req.guest.id,
                expiresAt: mongoose.trusted({ $gt: new Date() })
            }).select(fields).lean()
            : await Submission.findOne({ _id: req.params.id, userId: req.user._id }).select(fields).lean();
        if (!submission) {
            return res.status(404).json({ message: "Submission not found." });
        }
        res.set({ 'Cache-Control': 'no-store, private' });
        res.status(200).json({ submission });
    } catch (err) {
        sendError(res, err, "Failed to fetch submission.");
    }
};

module.exports = { submitCode, runCode, getSubmissionById };