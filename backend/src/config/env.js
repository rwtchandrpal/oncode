// Loads and validates environment variables before anything else runs (CQ-02).
// On failure it prints the offending variable NAMES (never values) and exits 1.
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({ quiet: true });

const nonEmpty = z.string().trim().min(1);
const optionalInt = (min, max) =>
  z.preprocess(
    (v) => (v === undefined || v === "" ? undefined : Number(v)),
    z.number().int().min(min).max(max).optional()
  );

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: optionalInt(1, 65535).default(3000),
  MONGO_URI: nonEmpty,
  JWT_KEY: nonEmpty,
  REDIS_HOST: nonEmpty,
  REDIS_PORT: optionalInt(1, 65535).default(6379),
  REDIS_PASS: z.string().optional(),
  JUDGE0_BASE_URL: z.url({ protocol: /^https?$/ }),
  JUDGE0_AUTH_TOKEN: z.string().optional(),
  JUDGE0_TIMEOUT_MS: optionalInt(100, 120000),
  JUDGE0_DEADLINE_MS: optionalInt(1000, 600000),
  GEMINI_API_KEY: nonEmpty,
  CLIENT_URL: z.url().default("http://localhost:5173"),
  // Number of reverse-proxy hops in front of the API (express "trust proxy"). 0 = trust none.
  TRUST_PROXY_HOPS: optionalInt(0, 10).default(0),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

const parseEnv = (source = process.env) => {
  const result = envSchema.safeParse(source);
  if (result.success) return { ok: true, env: Object.freeze(result.data) };

  const missing = [];
  const invalid = [];
  for (const issue of result.error.issues) {
    const name = String(issue.path[0]);
    const value = source[name];
    if (value === undefined || String(value).trim() === "") missing.push(name);
    else invalid.push(name);
  }
  return { ok: false, missing: [...new Set(missing)], invalid: [...new Set(invalid)] };
};

const parsed = parseEnv();
if (!parsed.ok) {
  // Plain stderr on purpose: the logger itself depends on this config.
  if (parsed.missing.length) console.error(`Missing env: ${parsed.missing.join(", ")}`);
  if (parsed.invalid.length) console.error(`Invalid env: ${parsed.invalid.join(", ")}`);
  console.error("See backend/.env.example for the expected variables.");
  process.exit(1);
}

module.exports = parsed.env;
module.exports.parseEnv = parseEnv;
