const { GoogleGenAI } = require('@google/genai');
const { errorBody } = require('../utils/AppError');
const logger = require('../utils/logger');
const Problem = require('../models/problem');
const client = require('../config/redis');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Demo sessions get a small daily AI budget (SEC-06). Fails open if Redis is unavailable.
const DEMO_AI_DAILY_LIMIT = 3;
const takeDemoAiQuota = async (user) => {
    if (!user?.isDemo) return true;
    const key = `demo_ai:${user._id}`;
    try {
        const count = await client.incr(key);
        if (count === 1) await client.expire(key, 24 * 60 * 60);
        return count <= DEMO_AI_DAILY_LIMIT;
    } catch (err) {
        logger.warn({ err }, "Redis error checking demo AI quota");
        return true;
    }
};

// Refund a demo AI question when Gemini fails, so outages do not burn the daily quota.
const refundDemoAiQuota = async (user) => {
    if (!user?.isDemo) return;
    try {
        await client.decr(`demo_ai:${user._id}`);
    } catch (err) {
        logger.warn({ err }, "Redis error refunding demo AI quota");
    }
};

const chatWithAI = async (req, res) => {
    let quotaTaken = false;
    try {
        // Validated by validation/ai.js
        const { problemId, userLanguage, userCode, userQuestion } = req.body;

        // Title and description come from the database, not the client (SEC-06)
        const problem = await Problem.findById(problemId).select('title description').lean();
        if (!problem) {
            return res.status(404).json(errorBody(404, "Problem not found."));
        }

        quotaTaken = await takeDemoAiQuota(req.user);
        if (!quotaTaken) {
            return res.status(429).json(errorBody(429, `Demo sessions can ask the AI tutor ${DEMO_AI_DAILY_LIMIT} questions per day. Create a free account to keep going.`));
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
            model: 'gemini-2.5-flash',
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
        logger.error({ err: error }, "Error generating AI response");
        if (quotaTaken) await refundDemoAiQuota(req.user);
        // Upstream overload / rate limit is temporary: say so instead of a generic 500
        if (error?.status === 503 || error?.status === 429) {
            return res.status(503).json(errorBody(503, "The AI tutor is busy right now. Please try again in a moment."));
        }
        res.status(500).json(errorBody(500, "Failed to generate AI response."));
    }
};

module.exports = chatWithAI;