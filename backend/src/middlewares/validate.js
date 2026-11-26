const { errorBody } = require("../utils/AppError");

// validate({ params, query, body }) parses each part with its zod schema.
// On success the parsed (trimmed / coerced / stripped) values replace the originals, so controllers
// only ever see validated input. On failure: 400 { error: { code: 'VALIDATION_ERROR', message }, details }.
const PARTS = ["params", "query", "body"];

const describe = (part, issue) => {
  const path = issue.path.join(".");
  // Schema-authored messages are full sentences; zod defaults get the field name prefixed.
  if (/[.!?]$/.test(issue.message) || !path) return issue.message;
  return `${path}: ${issue.message}`;
};

const validate = (schemas) => (req, res, next) => {
  const details = [];
  for (const part of PARTS) {
    const schema = schemas[part];
    if (!schema) continue;
    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) {
      for (const issue of result.error.issues) {
        details.push({ location: part, path: issue.path.join("."), message: describe(part, issue) });
      }
      continue;
    }
    if (part === "query") {
      // Express 5 exposes req.query as a getter; shadow it with the parsed value.
      Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true, enumerable: true });
    } else {
      req[part] = result.data;
    }
  }
  if (details.length) {
    return res.status(400).json(errorBody(400, details[0].message, "VALIDATION_ERROR", { details }));
  }
  next();
};

module.exports = validate;
