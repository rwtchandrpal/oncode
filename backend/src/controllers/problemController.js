const { createSubmission, getSubmission, getLanguageId, getstatusById } = require('../utils/judge0Utility');
const Problem = require('../models/problem');
const User = require('../models/user');
const mongoose = require('mongoose');
const Submission = require('../models/submission');

const encodeBase64 = (str) => {
    if (!str) return "";
    return Buffer.from(String(str), 'utf8').toString('base64');
};

// ==========================================
// HELPER FUNCTION: Validation & Judge0 Testing
// ==========================================
const validateAndTestProblem = async (problemData) => {
    const { title, description, referenceSolutions, hiddenTestCases, codeSnippets } = problemData;

    // Check basic required fields
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

    // Prepare the code for Judge0
    const solution = referenceSolutions[0];
    let langId;
    try {
        langId = getLanguageId(solution.language.toLowerCase());
    } catch (err) {
        return { isValid: false, error: err.message };
    }

    // Find the matching driver code so we can run the test cases
    const matchingSnippet = codeSnippets.find(
        snippet => snippet.language.toLowerCase() === solution.language.toLowerCase()
    );

    if (!matchingSnippet) {
        return { isValid: false, error: `Missing driver code snippet for language: ${solution.language}` };
    }

    const fullCodeToTest = matchingSnippet.driverCode.replaceAll("{{USER_CODE}}", () => solution.code);

    // Send to Judge0
    const submissionPayload = testCases.map(testCase => ({
        language_id: langId,
        source_code: encodeBase64(fullCodeToTest),
        stdin: encodeBase64(testCase.input),
        expected_output: encodeBase64(testCase.expectedOutput)
    }));

    try {
        const submitResult = await createSubmission(submissionPayload);
        const resultTokens = submitResult.map((elem) => (elem.token));
        const testResult = await getSubmission(resultTokens);

        for (const test of testResult) {
            if (test.status_id !== 3) { // 3 is "Accepted"
                return { isValid: false, error: "Reference Solution Error: " + getstatusById(test.status_id) };
            }
        }
    } catch (err) {
        return { isValid: false, error: "Judge0 validation failed: " + err.message };
    }

    // If we make it here, the problem is solvable and ready to save!
    return { isValid: true };
};


// ==========================================
// ADMIN CONTROLLERS (Create / Update / Delete)
// ==========================================
const createProblem = async (req, res) => {
    try {
        const validation = await validateAndTestProblem(req.body);
        
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.error });
        }

        const newProblem = await Problem.create({
            ...req.body,
            problemCreator: req.user._id
        });

        res.status(201).json({
            message: "Problem created and validated successfully",
            problem: newProblem
        });
    } catch (err) {
        return res.status(500).json({ message: "Failed to create problem: " + err.message });
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

        const mergedProblem = {
            ...existingProblem.toObject(),
            ...req.body
        };

        const validation = await validateAndTestProblem(mergedProblem);
        if (!validation.isValid) {
            return res.status(400).json({ message: validation.error });
        }

        const updatedProblem = await Problem.findByIdAndUpdate(id, { $set: req.body }, { runValidators: true, new: true });

        res.status(200).json({
            message: "Problem updated successfully", 
            problem: updatedProblem
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to update problem: " + err.message });
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

        res.status(200).json({ message: "Problem and associated data deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete problem: " + err.message });
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

        res.set({
            'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
            'Vary': 'Accept-Encoding'
        });
        res.status(200).json({ problem: fetchedProblem });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch problem: " + err.message });
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
        res.status(500).json({ message: "Failed to fetch solution: " + err.message });
    }
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getAllProblems = async (req, res) => {
    try {
        const query = {};

        // Keyword / Title Search (Regex escaped against ReDoS)
        if (req.query.search && req.query.search.trim()) {
            const sanitized = escapeRegex(req.query.search.trim());
            query.title = mongoose.trusted({ $regex: sanitized, $options: 'i' });
        }

        // Difficulty Filter
        if (req.query.difficulty && req.query.difficulty.toLowerCase() !== 'all') {
            query.difficulty = new RegExp(`^${escapeRegex(req.query.difficulty)}$`, 'i');
        }

        // Topic Filter
        if (req.query.topic && req.query.topic.toLowerCase() !== 'all') {
            query.topics = mongoose.trusted({ $in: [new RegExp(`^${escapeRegex(req.query.topic)}$`, 'i')] });
        }

        // Solved Status Filter (requires user)
        if (req.query.status && req.query.status.toLowerCase() !== 'all' && req.user) {
            const userDoc = await User.findById(req.user._id).select('problemsSolved').lean();
            const solvedIds = (userDoc?.problemsSolved || []).filter(Boolean);
            if (req.query.status.toLowerCase() === 'solved') {
                query._id = mongoose.trusted({ $in: solvedIds });
            } else if (req.query.status.toLowerCase() === 'unsolved') {
                query._id = mongoose.trusted({ $nin: solvedIds });
            }
        }

        // Pagination setup with backwards compatibility for unbounded requests
        const isUnbounded = req.query.limit === 'all' || (!req.query.page && !req.query.limit);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = isUnbounded ? 1000 : Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = isUnbounded ? 0 : (page - 1) * limit;

        const findQuery = Problem.find(query)
            .select('_id number title difficulty topics')
            .sort({ number: 1 });

        if (!isUnbounded) {
            findQuery.skip(skip).limit(limit);
        }

        const [allProblems, totalProblems, rawTopics] = await Promise.all([
            findQuery.lean(),
            Problem.countDocuments(query),
            Problem.distinct('topics')
        ]);

        const totalPages = isUnbounded ? 1 : Math.ceil(totalProblems / limit) || 1;

        // Distinct, normalized topics for filter dropdowns
        const uniqueTopicsMap = new Map();
        (rawTopics || []).forEach(t => {
            if (typeof t === 'string' && t.trim()) {
                const trimmed = t.trim();
                const lower = trimmed.toLowerCase();
                if (!uniqueTopicsMap.has(lower)) {
                    uniqueTopicsMap.set(lower, trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
                }
            }
        });
        const allTopics = Array.from(uniqueTopicsMap.values()).sort((a, b) => a.localeCompare(b));

        res.set({
            'Cache-Control': req.user ? 'private, no-cache' : 'public, max-age=30, stale-while-revalidate=60',
            'Vary': 'Accept-Encoding, Authorization'
        });
        res.status(200).json({
            allProblems,
            totalProblems,
            totalPages,
            currentPage: isUnbounded ? 1 : page,
            limit: isUnbounded ? totalProblems : limit,
            allTopics
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch problems: " + err.message });
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
        res.status(500).json({ message: "Failed to fetch solved problems: " + err.message });
    }
};

const getAllSubmissions = async (req, res) => {
    try {
        const userId = req.user._id;
        const problemId = req.params.id;

        const allSubmissions = await Submission.find({ userId, problemId })
            .sort({ createdAt: -1 })
            .select('_id status testCasesPassed testCasesTotal runtime memory language createdAt errorMessage code')
            .lean();

        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache'
        });
        res.status(200).json({
            submissions: allSubmissions
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to get past submissions: " + err.message });
    }
};

module.exports = { createProblem, updateProblem, deleteProblem, getAllProblems, getSolvedProblems, getProblem, getProblemSolution, getAllSubmissions };