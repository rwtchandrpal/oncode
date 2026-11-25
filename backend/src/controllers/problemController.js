const { createSubmission, getSubmission, newDeadline, getLanguageId, getstatusById } = require('../utils/judge0Utility');
const Problem = require('../models/problem');
const User = require('../models/user');
const mongoose = require('mongoose');
const Submission = require('../models/submission');
const { Judge0UnavailableError, EXECUTION_UNAVAILABLE_MESSAGE, sendError } = require('../utils/AppError');
const logger = require('../utils/logger');
const { getAllTopics, invalidateTopics } = require('../utils/topicsCache');

const encodeBase64 = (str) => {
    if (!str) return "";
    return Buffer.from(String(str), 'utf8').toString('base64');
};

// ==========================================
// HELPER FUNCTION: Validation & Judge0 Testing
// ==========================================
const lower = (v) => String(v || "").toLowerCase();

// Structural checks plus a Judge0 run of EVERY reference solution against its own language's driver
// code (BUG-10). Every language that has a reference solution needs exactly one snippet. (A snippet
// without a reference solution is still allowed, as in existing data; that driver is then unverified.)
const validateAndTestProblem = async (problemData) => {
    const { title, description, referenceSolutions, hiddenTestCases, codeSnippets } = problemData;

    if (!title || !description || !referenceSolutions || referenceSolutions.length === 0) {
        return { isValid: false, error: "Missing required data or reference solutions." };
    }

    const testCases = (hiddenTestCases || []);
    if (testCases.length === 0) {
        return { isValid: false, error: "At least one hidden test case is required." };
    }

    if (!codeSnippets || codeSnippets.length === 0) {
        return { isValid: false, error: "At least one code snippet (with driver code) is required." };
    }

    const snippetLangs = codeSnippets.map((s) => lower(s.language));
    const solutionLangs = referenceSolutions.map((s) => lower(s.language));
    if (new Set(snippetLangs).size !== snippetLangs.length) {
        return { isValid: false, error: "Each language can have only one code snippet." };
    }
    if (new Set(solutionLangs).size !== solutionLangs.length) {
        return { isValid: false, error: "Each language can have only one reference solution." };
    }
    const missingSnippet = solutionLangs.find((l) => !snippetLangs.includes(l));
    if (missingSnippet) {
        return { isValid: false, error: `Missing driver code snippet for language: ${missingSnippet}` };
    }

    for (const solution of referenceSolutions) {
        const language = lower(solution.language);
        let langId;
        try {
            langId = getLanguageId(language);
        } catch {
            return { isValid: false, error: "Unsupported reference solution language." };
        }
        const snippet = codeSnippets.find((s) => lower(s.language) === language);
        const fullCodeToTest = snippet.driverCode.replaceAll("{{USER_CODE}}", () => solution.code);

        const submissionPayload = testCases.map(testCase => ({
            language_id: langId,
            source_code: encodeBase64(fullCodeToTest),
            stdin: encodeBase64(testCase.input),
            expected_output: encodeBase64(testCase.expectedOutput)
        }));

        try {
            const deadline = newDeadline();
            const submitResult = await createSubmission(submissionPayload, deadline);
            const testResult = await getSubmission(submitResult.map((elem) => elem.token), deadline);

            const failed = testResult.find((test) => test.status_id !== 3); // 3 is "Accepted"
            if (failed) {
                return { isValid: false, error: `Reference Solution Error (${language}): ${getstatusById(failed.status_id)}` };
            }
        } catch (err) {
            if (err instanceof Judge0UnavailableError) {
                logger.error({ err: err.cause || err }, "Judge0 unavailable during problem validation");
                return { isValid: false, status: 503, error: EXECUTION_UNAVAILABLE_MESSAGE };
            }
            logger.error({ err }, "Problem validation error");
            return { isValid: false, status: 500, error: "Problem validation failed. Please try again." };
        }
    }

    return { isValid: true };
};

// Fields whose change can alter what Judge0 must verify (BUG-09). Compared by content only
// (subdocument _ids and key order ignored).
const JUDGE_FIELDS = {
    hiddenTestCases: (v) => (v || []).map((t) => [t.input, t.expectedOutput]),
    visibleTestCase: (v) => (v ? [v.input, v.expectedOutput] : null),
    codeSnippets: (v) => (v || []).map((s) => [lower(s.language), s.userSnippet, s.driverCode]),
    referenceSolutions: (v) => (v || []).map((s) => [lower(s.language), s.code]),
};
const changedJudgeFields = (existing, update) =>
    Object.keys(JUDGE_FIELDS).filter(
        (field) => field in update && JSON.stringify(JUDGE_FIELDS[field](update[field])) !== JSON.stringify(JUDGE_FIELDS[field](existing[field]))
    );

// ==========================================
// ADMIN CONTROLLERS (Create / Update / Delete)
// ==========================================
const createProblem = async (req, res) => {
    try {
        const validation = await validateAndTestProblem(req.body);
        
        if (!validation.isValid) {
            return res.status(validation.status || 400).json({ message: validation.error });
        }

        const newProblem = await Problem.create({
            ...req.body,
            problemCreator: req.user._id
        });
        await invalidateTopics();

        res.status(201).json({
            message: "Problem created and validated successfully",
            problem: newProblem
        });
    } catch (err) {
        if (err.name === 'ValidationError' || err.code === 11000) {
            logger.warn({ err }, "Create problem rejected");
            return res.status(400).json({ message: err.code === 11000 ? "A problem with this title already exists." : "Invalid problem data." });
        }
        return sendError(res, err, "Failed to create problem.");
    }
};

const updateProblem = async (req, res) => {
    const { id } = req.params;
    
    try {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid problem ID." });
        }

        // Fetch the existing problem first
        const existingProblem = await Problem.findById(id);
        if (!existingProblem) {
            return res.status(404).json({ message: "Problem not found." });
        }

        // Metadata-only edits (title, statement, topics...) do not need Judge0 (BUG-09)
        const existing = existingProblem.toObject();
        const judgeChanges = changedJudgeFields(existing, req.body);
        if (judgeChanges.length > 0) {
            const validation = await validateAndTestProblem({ ...existing, ...req.body });
            if (!validation.isValid) {
                return res.status(validation.status || 400).json({ message: validation.error });
            }
        }

        const updatedProblem = await Problem.findByIdAndUpdate(id, { $set: req.body }, { runValidators: true, returnDocument: 'after' });
        await invalidateTopics();

        res.status(200).json({
            message: "Problem updated successfully", 
            problem: updatedProblem
        });
    } catch (err) {
        if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000) {
            logger.warn({ err }, "Update problem rejected");
            return res.status(400).json({ message: err.code === 11000 ? "A problem with this title already exists." : "Invalid problem data." });
        }
        sendError(res, err, "Failed to update problem.");
    }
};

const deleteProblem = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format." });
        }

        const problem = await Problem.findById(id);
        if (!problem) {
            return res.status(404).json({ message: "Problem not found." });
        }

        let session = null;
        try {
            session = await mongoose.startSession();
            session.startTransaction();
        } catch {
            session = null; // Standalone MongoDB fallback
        }

        try {
            const opts = session ? { session } : {};

            // Problem.findByIdAndDelete triggers the findOneAndDelete pre-hook with session options,
            // which cascades the deletion to User.problemsSolved and Submissions atomically.
            await Problem.findByIdAndDelete(id, opts);

            if (session) {
                await session.commitTransaction();
                session.endSession();
            }
        } catch (opErr) {
            if (session) {
                await session.abortTransaction();
                session.endSession();
            }
            throw opErr;
        }

        await invalidateTopics();
        res.status(200).json({ message: "Problem and associated data deleted successfully." });
    } catch (err) {
        sendError(res, err, "Failed to delete problem.");
    }
};

// ==========================================
// USER CONTROLLERS (Fetching / Viewing)
// ==========================================

const getProblem = async (req, res) => {
    const { id } = req.params;
    try {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const fetchedProblem = await Problem.findById(id)
            .select('_id number title difficulty topics description constraints examples visibleTestCase codeSnippets.language codeSnippets.userSnippet')
            .lean();

        if (!fetchedProblem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        // Authenticated response: browser-only cache, short lifetime (SEC-13)
        res.set({
            'Cache-Control': 'private, max-age=60',
            'Vary': 'Accept-Encoding, Authorization'
        });
        res.status(200).json({ problem: fetchedProblem });
    } catch (err) {
        sendError(res, err, "Failed to fetch problem.");
    }
};

// Admin only (route uses adminMiddleware): the full problem including hidden test cases, driver code and
// reference solutions, used to prefill the edit form.
const getProblemForAdmin = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id)
            .select('_id number title difficulty topics description constraints examples visibleTestCase hiddenTestCases codeSnippets referenceSolutions')
            .lean();
        if (!problem) {
            return res.status(404).json({ message: "Problem not found." });
        }
        res.set({ 'Cache-Control': 'no-store, private' });
        res.status(200).json({ problem });
    } catch (err) {
        sendError(res, err, "Failed to fetch problem.");
    }
};

const getProblemSolution = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    try {
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid problem ID format." });
        }

        const problem = await Problem.findById(id).select('referenceSolutions title').lean();
        if (!problem) {
            return res.status(404).json({ message: "Problem not found." });
        }

        // Admins always have access; standard users must have solved the problem
        let isAuthorized = userRole === 'admin';
        if (!isAuthorized) {
            const hasSolved = await User.exists({ _id: userId, problemsSolved: id });
            isAuthorized = !!hasSolved;
        }

        if (!isAuthorized) {
            return res.status(403).json({
                isLocked: true,
                message: "You must solve this problem before viewing the official solution."
            });
        }

        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache'
        });
        return res.status(200).json({
            isLocked: false,
            referenceSolutions: problem.referenceSolutions || []
        });
    } catch (err) {
        sendError(res, err, "Failed to fetch solution.");
    }
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const CANONICAL_DIFFICULTY = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const getAllProblems = async (req, res) => {
    try {
        const query = {};

        // Keyword / Title Search (Regex escaped against ReDoS)
        if (req.query.search && req.query.search.trim()) {
            const sanitized = escapeRegex(req.query.search.trim());
            query.title = mongoose.trusted({ $regex: sanitized, $options: 'i' });
        }

        // Difficulty: exact match on the stored canonical value, so the index can be used (PERF-01)
        const difficulty = CANONICAL_DIFFICULTY[req.query.difficulty];
        if (difficulty) {
            query.difficulty = difficulty;
        }

        // Topic Filter
        if (req.query.topic && req.query.topic.toLowerCase() !== 'all') {
            query.topics = mongoose.trusted({ $in: [new RegExp(`^${escapeRegex(req.query.topic)}$`, 'i')] });
        }

        // The signed-in user's solved set: used for the status filter and the per-row isSolved flag (PERF-05)
        let solvedIds = [];
        if (req.user) {
            const userDoc = await User.findById(req.user._id).select('problemsSolved').lean();
            solvedIds = (userDoc?.problemsSolved || []).filter(Boolean);
            if (req.query.status === 'solved') {
                query._id = mongoose.trusted({ $in: solvedIds });
            } else if (req.query.status === 'unsolved') {
                query._id = mongoose.trusted({ $nin: solvedIds });
            }
        }

        // Always paginated (PERF-01): default 20, max 100
        const page = req.query.page || 1;
        const limit = Math.min(MAX_PAGE_SIZE, req.query.limit || DEFAULT_PAGE_SIZE);
        const skip = (page - 1) * limit;

        const [rows, totalProblems, allTopics] = await Promise.all([
            Problem.find(query)
                .select('_id number title difficulty topics')
                .sort({ number: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Problem.countDocuments(query),
            getAllTopics()
        ]);

        const solvedSet = new Set(solvedIds.map(String));
        const allProblems = rows.map((p) => ({ ...p, isSolved: solvedSet.has(String(p._id)) }));
        const totalPages = Math.ceil(totalProblems / limit) || 1;

        res.set({
            'Cache-Control': req.user ? 'private, no-cache' : 'public, max-age=30, stale-while-revalidate=60',
            'Vary': 'Accept-Encoding, Authorization'
        });
        res.status(200).json({
            allProblems,
            totalProblems,
            totalPages,
            currentPage: page,
            limit,
            allTopics
        });
    } catch (err) {
        sendError(res, err, "Failed to fetch problems.");
    }
};

const getSolvedProblems = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate({
            path: "problemsSolved",
            select: "_id number title difficulty topics"
        }).lean();

        // Filter out null/dangling references from deleted problems
        const validSolved = (user?.problemsSolved || []).filter(Boolean);

        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache'
        });
        res.status(200).json({
            solvedProblems: validSolved
        });

    } catch (err) {
        sendError(res, err, "Failed to fetch solved problems.");
    }
};

const getAllSubmissions = async (req, res) => {
    try {
        const userId = req.user._id;
        const problemId = req.params.id;

        // Paginated summary rows without code/errorMessage (PERF-02); GET /submission/:id has the details
        const page = req.query.page || 1;
        const limit = req.query.limit || 20;
        const filter = { userId, problemId };
        const [allSubmissions, total] = await Promise.all([
            Submission.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('_id status testCasesPassed testCasesTotal runtime memory language createdAt')
                .lean(),
            Submission.countDocuments(filter)
        ]);

        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache'
        });
        res.status(200).json({
            submissions: allSubmissions,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1
        });
    } catch (err) {
        sendError(res, err, "Failed to get past submissions.");
    }
};

module.exports = { createProblem, updateProblem, deleteProblem, getAllProblems, getSolvedProblems, getProblem, getProblemForAdmin, getProblemSolution, getAllSubmissions };