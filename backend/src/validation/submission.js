const { z, language } = require("./common");

// The 64,000-character cap is enforced in the controller so it can answer 413 (SEC-08).
const executeBody = z.object({
  code: z.string({ error: "Code must be text." }).min(1, "Code is required."),
  language,
});

module.exports = { executeBody };
