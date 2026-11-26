const { z } = require("zod");

const objectId = z.string({ error: "Invalid id." }).regex(/^[a-f\d]{24}$/i, "Invalid id.");
const idParams = z.object({ id: objectId });

// Languages the judge supports (see utils/judge0Utility.getLanguageId)
const LANGUAGES = ["cpp", "java"];
const language = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.enum(LANGUAGES, { error: "Language must be one of: cpp, java." })
);

module.exports = { z, objectId, idParams, LANGUAGES, language };
