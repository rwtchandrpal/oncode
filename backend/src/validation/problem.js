const { z, language, objectId } = require("./common");
const { SLUG_PATTERN, MAX_SLUG_LENGTH, isUsable } = require("../utils/slug");

const text = (max, label) => z.string({ error: `${label} must be text.` }).max(max, `${label} is too long (max ${max} characters).`);
const requiredText = (max, label) => text(max, label).min(1, `${label} is required.`);

// 200 KB per test input/output, the same cap the seed data uses.
const MAX_TEST_CHARS = 200 * 1024;
const testCase = z.object({
  input: requiredText(MAX_TEST_CHARS, "Test input"),
  expectedOutput: requiredText(MAX_TEST_CHARS, "Expected output"),
});

const lowerTrim = (v) => (typeof v === "string" ? v.trim().toLowerCase() : v);
const slugText = z
  .string()
  .max(MAX_SLUG_LENGTH, `Slug is too long (max ${MAX_SLUG_LENGTH} characters).`)
  .regex(SLUG_PATTERN, "Slug must be lowercase words joined by hyphens, e.g. two-sum.");

// Optional URL key (kebab-case), as used by backend/seed/seed.js. An empty string means "not given":
// generated from the title on create, left unchanged on update.
const slug = z.preprocess(
  lowerTrim,
  z.union([
    z.literal(""),
    slugText.refine(isUsable, "This slug is reserved, choose another one."),
  ])
);

// GET /problem/:idOrSlug: a 24-hex ObjectId or a slug (case-insensitive)
const problemKeyParams = z.object({
  idOrSlug: z.preprocess(lowerTrim, z.union([objectId, slugText], { error: "Invalid problem id or slug." })),
});

// Strips unknown keys, so clients cannot set number, problemCreator, _id or timestamps.
const problemShape = {
  title: requiredText(200, "Title").trim(),
  slug: slug.optional(),
  description: requiredText(50000, "Description"),
  difficulty: z.enum(["Easy", "Medium", "Hard"], { error: "Difficulty must be Easy, Medium or Hard." }),
  topics: z.array(requiredText(50, "Topic").trim()).max(20, "At most 20 topics."),
  constraints: z.array(text(500, "Constraint")).max(50, "At most 50 constraints."),
  examples: z
    .array(z.object({ input: requiredText(5000, "Example input"), output: requiredText(5000, "Example output"), explanation: text(5000, "Explanation").optional() }))
    .max(20, "At most 20 examples."),
  visibleTestCase: testCase,
  hiddenTestCases: z.array(testCase).min(1, "At least one hidden test case is required.").max(100, "At most 100 hidden test cases."),
  codeSnippets: z
    .array(
      z.object({
        language,
        userSnippet: requiredText(20000, "Starter code"),
        driverCode: requiredText(100000, "Driver code").refine((v) => v.includes("{{USER_CODE}}"), "Driver code must contain {{USER_CODE}}."),
      })
    )
    .min(1, "At least one code snippet is required.")
    .max(2, "At most one code snippet per language."),
  referenceSolutions: z
    .array(z.object({ language, code: requiredText(64000, "Reference solution") }))
    .min(1, "At least one reference solution is required.")
    .max(2, "At most one reference solution per language."),
};

const createProblemBody = z.object({
  ...problemShape,
  constraints: problemShape.constraints.default([]),
  examples: problemShape.examples.default([]),
  difficulty: problemShape.difficulty.default("Easy"),
});

const updateProblemBody = z.object(problemShape).partial();

const DIFFICULTIES = ["all", "easy", "medium", "hard"];
const STATUSES = ["all", "solved", "unsolved"];
const lowerEnum = (values, message) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() : v), z.enum(values, { error: message }));

// Every value must be a single string: repeated params (?search=a&search=b) arrive as arrays and are rejected.
const listProblemsQuery = z.object({
  search: text(100, "Search"),
  difficulty: lowerEnum(DIFFICULTIES, "Difficulty must be all, easy, medium or hard."),
  topic: text(60, "Topic"),
  status: lowerEnum(STATUSES, "Status must be all, solved or unsolved."),
  page: z.coerce.number({ error: "Page must be a positive integer." }).int("Page must be a positive integer.").min(1, "Page must be a positive integer.").max(100000, "Page is too large."),
  // Always paginated: no "all" / unbounded mode
  limit: z.coerce.number({ error: "Limit must be an integer between 1 and 100." }).int("Limit must be an integer between 1 and 100.").min(1, "Limit must be an integer between 1 and 100.").max(100, "Limit must be an integer between 1 and 100."),
}).partial();

const listSubmissionsQuery = z.object({
  page: z.coerce.number({ error: "Page must be a positive integer." }).int().min(1, "Page must be a positive integer.").max(100000, "Page is too large."),
  limit: z.coerce.number({ error: "Limit must be an integer between 1 and 50." }).int().min(1, "Limit must be an integer between 1 and 50.").max(50, "Limit must be an integer between 1 and 50."),
}).partial();

module.exports = { createProblemBody, updateProblemBody, listProblemsQuery, listSubmissionsQuery, problemKeyParams };
