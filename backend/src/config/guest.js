// Guest mode settings in one place.
// A guest is a short-lived signed token with a random id: no user document, no saved progress.
// The object is intentionally not frozen so tests can flip `enabled`; nothing else writes to it.
const env = require("./env");

const SESSION_HOURS = 4;

const guestConfig = {
  // GUEST_MODE_ENABLED=false turns guest mode off: no new sessions, existing guest tokens are refused.
  enabled: env.GUEST_MODE_ENABLED,
  // Fixed lifetime of a guest session; guest submissions expire with it.
  sessionSeconds: SESSION_HOURS * 60 * 60,
  // Run + Submit per guest session
  executionsPerSession: 30,
  // AI tutor questions per guest session
  aiQuestionsPerSession: 5,
  // New guest sessions per IP
  sessionsPerIpPerHour: 10,
  // Run + Submit across ALL guests, protecting Judge0 from distributed abuse
  globalExecutionsPer15Min: 300,
};

module.exports = guestConfig;
