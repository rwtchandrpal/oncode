// Test accounts for the LOCAL QA database only (scripts/qa/setup-local.js refuses non-local URIs).
// These are throwaway values, not production credentials.
const ACCOUNTS = {
  admin: { email: "admin@qa.oncode.test", password: "QaAdmin!local-only-1", firstName: "QaAdmin", role: "admin" },
  user: { email: "user@qa.oncode.test", password: "QaUser!local-only-1", firstName: "QaUser", role: "user" },
  user2: { email: "user2@qa.oncode.test", password: "QaUser2!local-only-1", firstName: "QaUserTwo", role: "user" },
};

module.exports = { ACCOUNTS };
