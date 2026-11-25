const { z } = require("./common");

// Oversized input is rejected instead of silently truncated (SEC-08).
const doubtBody = z.object({
  userQuestion: z.string({ error: "Question must be text." }).trim().min(1, "Missing required fields.").max(1000, "Question is too long (max 1,000 characters)."),
  userCode: z.string({ error: "Code must be text." }).min(1, "Missing required fields.").max(20000, "Code is too long for the AI tutor (max 20,000 characters)."),
  userLanguage: z.string().max(20, "Language is too long.").optional(),
  problemTitle: z.string({ error: "Problem title must be text." }).max(200, "Problem title is too long.").optional(),
  problemDescription: z.string({ error: "Problem description must be text." }).max(50000, "Problem description is too long.").optional(),
});

module.exports = { doubtBody };
