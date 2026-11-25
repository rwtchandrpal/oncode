const { z } = require("./common");

// bcrypt only uses the first 72 bytes of a password, so longer ones are rejected rather than
// silently truncated (SEC-11).
const PASSWORD_MAX_BYTES = 72;
const byteLength = (s) => Buffer.byteLength(s, "utf8");

// "Required" for a missing field, "must be text" for a wrong type
const typeError = (label) => ({ error: (iss) => (iss.input === undefined ? `${label} is required.` : `${label} must be text.`) });

const unknownKeys = { error: (iss) => (iss.code === "unrecognized_keys" ? "Invalid properties provided in the request." : undefined) };

const email = z
  .string(typeError("Email"))
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .max(254, "Email is too long.")
  .pipe(z.email({ error: "Please provide a valid email address." }));

const strongPassword = z
  .string(typeError("Password"))
  .refine((p) => byteLength(p) <= PASSWORD_MAX_BYTES, `Password cannot be longer than ${PASSWORD_MAX_BYTES} bytes.`)
  .refine(
    (p) => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p),
    "Password must be at least 8 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character."
  );

const firstName = z
  .string(typeError("First name"))
  .trim()
  .min(1, "First name must be between 1 and 50 characters long.")
  .max(50, "First name must be between 1 and 50 characters long.");

// Optional; an empty string (the signup form's default) means "not provided".
const lastName = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .string({ error: "Last name must be text." })
    .trim()
    .max(50, "Last name must be between 1 and 50 characters long.")
    .optional()
);

const registerBody = z.strictObject({ firstName, lastName, email, password: strongPassword }, unknownKeys);

const adminRegisterBody = z.strictObject(
  { firstName, lastName, email, password: strongPassword, role: z.enum(["user", "admin"], { error: "Role must be user or admin." }).default("user") },
  unknownKeys
);

const loginBody = z.object({
  email: z.string({ error: "Please provide both email and password." }).trim().toLowerCase().min(1, "Please provide both email and password.").max(254, "Invalid credentials."),
  // Capped generously so existing accounts keep working; only the input size is bounded.
  password: z.string({ error: "Please provide both email and password." }).min(1, "Please provide both email and password.").max(1024, "Invalid credentials."),
});

module.exports = { registerBody, adminRegisterBody, loginBody, PASSWORD_MAX_BYTES };
