const { GoogleGenAI } = require('@google/genai');
const { errorBody, AppError, sendError } = require('../utils/AppError');
const { takeGuestAiQuestion, refundGuestQuota } = require('../utils/guestSession');
const logger = require('../utils/logger');
const Problem = require('../models/problem');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Model used by the AI tutor
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

const chatWithAI = async (req, res) => {
    let guestQuotaKey = null;
    try {
        // Validated by validation/ai.js
        const { problemId, userLanguage, userCode, userQuestion } = req.body;

        // Title and description come from the database, not the client (SEC-06)
        const problem = await Problem.findById(problemId).select('title description').lean();
        if (!problem) {
            return res.status(404).json(errorBody(404, "Problem not found."));
        }

        // Guests: 5 questions per guest session (SEC-06); fails closed when Redis is down (throws 429 / 503).
        // A Gemini failure refunds the question below.
        if (req.guest) {
            guestQuotaKey = await takeGuestAiQuestion(req.guest);
        }


        // Keep the prompt small to protect token limits
        const safeQuestion = userQuestion;
        const safeCode = userCode.substring(0, 5000);
        const safeTitle = problem.title;
        const safeLanguage = userLanguage || "code";
        const safeDescription = (problem.description || "No description provided.").substring(0, 2000);

        // The Data Plane: Combine the necessary world state safely
        const worldStateContext = `
            PROBLEM: ${safeTitle}
            DESCRIPTION: ${safeDescription}
            
            USER'S CODE (${safeLanguage}):
            \`\`\`${safeLanguage}
            ${safeCode}
            \`\`\`
            
            USER'S QUESTION:
            ${safeQuestion}
        `;

        // The API Call
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            config: {
                // The Control Plane
                systemInstruction: `You are an expert programming tutor. 
                Your goal is to help students understand their mistakes.
                RULES:
                - DO NOT provide the complete working solution.
                - Point out logical flaws or syntax errors in their current code.
                - Provide hints or analyze time/space complexity.
                - Keep your response concise and formatted in Markdown.`
            },
            // The Data Plane
            contents: worldStateContext,
        });

        // Return the single response to the frontend
        res.status(200).json({ reply: response.text });

    } catch (error) {
        // Guest quota exhausted (429) or unavailable (503): client-safe AppError, nothing to refund
        if (error instanceof AppError) return sendError(res, error);
        logger.error({ err: error }, "Error generating AI response");
        await refundGuestQuota(guestQuotaKey);
        // Upstream overload / rate limit is temporary: say so instead of a generic 500
        if (error?.status === 503 || error?.status === 429) {
            return res.status(503).json(errorBody(503, "The AI tutor is busy right now. Please try again in a moment."));
        }
        res.status(500).json(errorBody(500, "Failed to generate AI response."));
    }
};

module.exports = chatWithAI;