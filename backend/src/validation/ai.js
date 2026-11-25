const { z, objectId } = require("./common");

// Oversized input is rejected instead of silently truncated (SEC-08). The problem title and
// description are loaded server-side from problemId (SEC-06), so they are not accepted from the client.
const doubtBody = z.object({
  problemId: objectId,
  userQuestion: z.string({ error: "Question must be text." }).trim().min(1, "Missing required fields.").max(1000, "Question is too long (max 1,000 characters)."),
  userCode: z.string({ error: "Code must be text." }).min(1, "Missing required fields.").max(20000, "Code is too long for the AI tutor (max 20,000 characters)."),
  userLanguage: z.enum(["cpp", "java"], { error: "Language must be one of: cpp, java." }).optional(),
});

module.exports = { doubtBody };
