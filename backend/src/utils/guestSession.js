// Guest sessions: signing guest tokens and charging per-session quotas.
//
// A guest token carries { typ: "guest", gid } and nothing else: no _id, email or role. Middleware
// (middlewares/authenticate.js) turns it into req.guest = { id, expiresAt }; it never becomes req.user.
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const client = require("../config/redis");
const guestConfig = require("../config/guest");
const { AppError } = require("./AppError");
const logger = require("./logger");

const GUEST_TOKEN_TYPE = "guest";
const GUEST_ID_PATTERN = /^[0-9a-f]{32}$/;

const GUEST_UNAVAILABLE_MESSAGE = "Guest mode is temporarily unavailable. Please log in or sign up to continue.";

const signGuestToken = () => {
  const gid = crypto.randomBytes(16).toString("hex");
  const token = jwt.sign({ typ: GUEST_TOKEN_TYPE, gid }, process.env.JWT_KEY, {
    expiresIn: guestConfig.sessionSeconds,
  });
  const { exp } = jwt.decode(token);
  return { token, gid, expiresAt: new Date(exp * 1000) };
};

const isGuestPayload = (payload) => payload?.typ === GUEST_TOKEN_TYPE;

const isValidGuestId = (gid) => typeof gid === "string" && GUEST_ID_PATTERN.test(gid);

// Takes one unit of a per-session quota (kind: "exec" | "ai"). Throws 429 when the quota is used up
// and 503 when Redis is unavailable: guests fail CLOSED, unlike users, because the quota is the main
// abuse control for anonymous sessions. Returns the key so the caller can refund it.
const takeGuestQuota = async (guest, kind, limit, exhaustedMessage) => {
  const key = `guest_${kind}:${guest.id}`;
  let count;
  try {
    count = await client.incr(key);
    if (count === 1) await client.expireAt(key, Math.ceil(guest.expiresAt.getTime() / 1000));
  } catch (err) {
    logger.warn({ code: err.code || err.message }, "[guest] quota check failed (Redis unavailable)");
    throw new AppError(503, GUEST_UNAVAILABLE_MESSAGE, "GUEST_MODE_UNAVAILABLE");
  }
  if (count > limit) {
    throw new AppError(429, exhaustedMessage, "GUEST_QUOTA_EXCEEDED");
  }
  return key;
};

// Gives a quota unit back when the request never produced a result (Judge0 or Gemini down).
const refundGuestQuota = async (key) => {
  if (!key) return;
  try {
    await client.decr(key);
  } catch (err) {
    logger.warn({ code: err.code || err.message }, "[guest] quota refund failed (Redis unavailable)");
  }
};

const takeGuestExecution = (guest) =>
  takeGuestQuota(
    guest,
    "exec",
    guestConfig.executionsPerSession,
    `Guest sessions can run or submit code ${guestConfig.executionsPerSession} times. Sign up for free to keep going.`
  );

const takeGuestAiQuestion = (guest) =>
  takeGuestQuota(
    guest,
    "ai",
    guestConfig.aiQuestionsPerSession,
    `Guest sessions can ask the AI tutor ${guestConfig.aiQuestionsPerSession} questions. Sign up for free to keep asking.`
  );

module.exports = {
  GUEST_UNAVAILABLE_MESSAGE,
  signGuestToken,
  isGuestPayload,
  isValidGuestId,
  takeGuestExecution,
  takeGuestAiQuestion,
  refundGuestQuota,
};
