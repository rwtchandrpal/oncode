// Guest mode (docs/GUEST_MODE_DESIGN.md): stateless guest sessions, isolation from user data,
// per-session quotas and the kill switch.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import {
  connect,
  disconnect,
  resetData,
  seed,
  api,
  login,
  auth,
  PASSWORDS,
  MARKERS,
  redis,
  User,
  Submission,
} from "./helpers/app.js";

const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");
const guestConfig = require("../src/config/guest.js");
const GuestSubmission = require("../src/models/guestSubmission.js");

let fx;
let userToken;

// Clears only the per-IP guest-session limiter, so tests can start as many guests as they need
const resetGuestSessionLimiter = async () => {
  const keys = await redis.keys("rl:guest-session:*");
  if (keys.length) await redis.del(keys);
};

const startGuest = async () => {
  await resetGuestSessionLimiter();
  const res = await api().post("/user/guest");
  if (res.status !== 201) throw new Error(`guest session failed: ${res.status}`);
  return res.body.token;
};

beforeAll(async () => {
  await connect();
  await resetData();
  fx = await seed();
  userToken = await login("user@test.local", PASSWORDS.user);
});
afterAll(disconnect);
afterEach(() => {
  guestConfig.enabled = true;
});

describe("demo accounts are gone", () => {
  it("POST /user/demo no longer exists", async () => {
    const users = await User.countDocuments();
    expect((await api().post("/user/demo")).status).toBe(404);
    expect(await User.countDocuments()).toBe(users);
  });

  it("/user/check returns no demo fields", async () => {
    const res = await api().get("/user/check").set(auth(userToken));
    expect(res.body.user).not.toHaveProperty("isDemo");
    expect(res.body.user).not.toHaveProperty("expiresAt");
  });
});

describe("POST /user/guest", () => {
  it("returns a 4-hour guest token and creates no user document", async () => {
    const users = await User.countDocuments();
    const res = await api().post("/user/guest");
    expect(res.status).toBe(201);
    expect(res.headers["cache-control"]).toMatch(/no-store/);
    const payload = jwt.decode(res.body.token);
    expect(payload).toMatchObject({ typ: "guest" });
    expect(payload.gid).toMatch(/^[0-9a-f]{32}$/);
    expect(payload).not.toHaveProperty("_id");
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("role");
    expect(payload.exp - payload.iat).toBe(4 * 60 * 60);
    expect(new Date(res.body.guest.expiresAt).getTime()).toBe(payload.exp * 1000);
    expect(await User.countDocuments()).toBe(users);
  });

  it("is rate limited per IP", async () => {
    await redis.flushDb();
    for (let i = 0; i < guestConfig.sessionsPerIpPerHour; i++) {
      expect((await api().post("/user/guest")).status).toBe(201);
    }
    const res = await api().post("/user/guest");
    expect(res.status).toBe(429);
    await redis.flushDb();
  });

  it("answers 503 when guest mode is switched off", async () => {
    guestConfig.enabled = false;
    const res = await api().post("/user/guest");
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("GUEST_MODE_DISABLED");
  });
});

describe("guest tokens never act as a user", () => {
  const userOnly = [
    ["get", "/user/check"],
    ["get", "/user/profile"],
    ["delete", "/user/profile"],
    ["get", "/problem/solved"],
    ["get", "/admin/dashboard"],
    ["post", "/user/admin/register"],
    ["get", "/submission/health"],
  ];

  it.each(userOnly)("%s %s -> 403 GUEST_NOT_ALLOWED", async (method, path) => {
    const token = await startGuest();
    const res = await api()[method](path).set(auth(token)).send({});
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("GUEST_NOT_ALLOWED");
  });

  it("a guest token that also carries a real user _id is still only a guest", async () => {
    const forged = jwt.sign(
      { typ: "guest", gid: "a".repeat(32), _id: String(fx.user._id), role: "admin" },
      process.env.JWT_KEY,
      { expiresIn: 3600 }
    );
    expect((await api().get("/user/check").set(auth(forged))).status).toBe(403);
    expect((await api().get("/admin/dashboard").set(auth(forged))).status).toBe(403);
    expect((await api().get("/user/profile").set(auth(forged))).status).toBe(403);
  });

  it("rejects a guest token signed with the wrong key, expired, or with a malformed id", async () => {
    const wrongKey = jwt.sign({ typ: "guest", gid: "b".repeat(32) }, "not-the-key", { expiresIn: 3600 });
    const expired = jwt.sign({ typ: "guest", gid: "c".repeat(32) }, process.env.JWT_KEY, { expiresIn: -10 });
    const badId = jwt.sign({ typ: "guest", gid: { $ne: null } }, process.env.JWT_KEY, { expiresIn: 3600 });
    for (const token of [wrongKey, expired, badId]) {
      const res = await api().get(`/problem/${fx.problem._id}`).set(auth(token));
      expect(res.status).toBe(401);
    }
  });

  it("a guest can open a problem; existing guest tokens stop working when guest mode is off", async () => {
    const token = await startGuest();
    const ok = await api().get(`/problem/${fx.problem._id}`).set(auth(token));
    expect(ok.status).toBe(200);
    expect(ok.body.problem.title).toBe("Double It");

    guestConfig.enabled = false;
    const off = await api().get(`/problem/${fx.problem._id}`).set(auth(token));
    expect(off.status).toBe(401);
    expect(off.body.error.code).toBe("GUEST_MODE_DISABLED");
  });

  it("exit guest mode: logout revokes the guest token", async () => {
    const token = await startGuest();
    expect((await api().post("/user/logout").set(auth(token))).status).toBe(200);
    const res = await api().get(`/problem/${fx.problem._id}`).set(auth(token));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("GUEST_SESSION_ENDED");
  });

  it("users are unaffected: a user token still reaches user-only routes", async () => {
    expect((await api().get("/user/check").set(auth(userToken))).status).toBe(200);
    expect((await api().get(`/problem/${fx.problem._id}`).set(auth(userToken))).status).toBe(200);
  });

  it("the problem list treats a guest like an anonymous visitor", async () => {
    const token = await startGuest();
    const res = await api().get("/problem/").set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.allProblems.length).toBeGreaterThan(0);
    expect(res.body.allProblems.every((p) => p.isSolved === false)).toBe(true);
  });
});

describe("guest run and submit", () => {
  const run = (token, code = "// ok") =>
    api().post(`/submission/run/${fx.problem._id}`).set(auth(token)).send({ code, language: "cpp" });
  const submit = (token, code = "// ok") =>
    api().post(`/submission/submit/${fx.problem._id}`).set(auth(token)).send({ code, language: "cpp" });

  it("run works for a guest and stores nothing", async () => {
    const token = await startGuest();
    const before = await GuestSubmission.countDocuments();
    const res = await run(token);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Accepted");
    expect(await GuestSubmission.countDocuments()).toBe(before);
  });

  it("submit stores one expiring guest submission and never touches user data", async () => {
    const token = await startGuest();
    const { gid, exp } = jwt.decode(token);
    const submissions = await Submission.countDocuments();
    const solvedBefore = (await User.findById(fx.user._id).lean()).problemsSolved.length;

    const res = await submit(token);
    expect(res.status).toBe(201);
    expect(res.body.submissionResult).toMatchObject({ status: "Accepted", testCasesPassed: 2, testCasesTotal: 2 });

    const stored = await GuestSubmission.find({ guestId: gid }).lean();
    expect(stored).toHaveLength(1);
    expect(stored[0].expiresAt.getTime()).toBe(exp * 1000);
    expect(stored[0]).not.toHaveProperty("failedTestCase");
    expect(stored[0]).not.toHaveProperty("errorDetail");
    expect(await Submission.countDocuments()).toBe(submissions);
    expect((await User.findById(fx.user._id).lean()).problemsSolved).toHaveLength(solvedBefore);
  });

  it("a failed guest submit leaks no hidden test data", async () => {
    const token = await startGuest();
    const res = await submit(token, "// MOCK_RE");
    expect(res.status).toBe(201);
    expect(res.body.submissionResult.status).toMatch(/Runtime Error/);
    expect(JSON.stringify(res.body)).not.toMatch(MARKERS);
    expect(JSON.stringify(res.body)).not.toMatch(/echo:/);
  });

  it("Judge0 down: 503, nothing stored, quota refunded", async () => {
    const token = await startGuest();
    const { gid } = jwt.decode(token);
    const res = await submit(token, "// MOCK_DOWN");
    expect(res.status).toBe(503);
    expect(await GuestSubmission.countDocuments({ guestId: gid })).toBe(0);
    expect(Number(await redis.get(`guest_exec:${gid}`))).toBe(0);
  });

  it("the per-session quota counts run + submit and then answers 429", async () => {
    const token = await startGuest();
    const { gid } = jwt.decode(token);
    await redis.set(`guest_exec:${gid}`, String(guestConfig.executionsPerSession - 1));
    expect((await run(token)).status).toBe(200);
    const blocked = await submit(token);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe("GUEST_QUOTA_EXCEEDED");
  });

  it("the quota key expires with the guest session", async () => {
    const token = await startGuest();
    const { gid } = jwt.decode(token);
    await run(token);
    const ttl = await redis.ttl(`guest_exec:${gid}`);
    expect(ttl).toBeGreaterThan(4 * 60 * 60 - 60);
    expect(ttl).toBeLessThanOrEqual(4 * 60 * 60);
  });

  it("the global guest budget blocks guests but never users", async () => {
    const token = await startGuest();
    const keys = await redis.keys("rl:guest-exec-global:*");
    expect(keys.length).toBeGreaterThan(0);
    // KEEPTTL: the limiter's script resets a counter that has no expiry
    await redis.set(keys[0], String(guestConfig.globalExecutionsPer15Min), { KEEPTTL: true });
    try {
      expect((await run(token)).status).toBe(429);
      expect((await run(userToken)).status).toBe(200);
    } finally {
      await redis.del(keys);
    }
  });

  it("Redis down: guests fail closed (503) while users keep working", async () => {
    const token = await startGuest();
    const sendCommand = vi.spyOn(redis, "sendCommand").mockRejectedValue(new Error("ECONNREFUSED"));
    const incr = vi.spyOn(redis, "incr").mockRejectedValue(new Error("ECONNREFUSED"));
    try {
      const guestRes = await run(token);
      expect(guestRes.status).toBe(503);
      expect(guestRes.body.error.code).toBe("GUEST_MODE_UNAVAILABLE");
      expect((await run(userToken)).status).toBe(200);
    } finally {
      sendCommand.mockRestore();
      incr.mockRestore();
    }
  });
});

describe("guest history isolation", () => {
  let guestA;
  let guestB;
  let guestSubId;
  let userSubId;

  beforeAll(async () => {
    guestA = await startGuest();
    guestB = await startGuest();
    const g = await api()
      .post(`/submission/submit/${fx.problem._id}`)
      .set(auth(guestA))
      .send({ code: "// a", language: "cpp" });
    guestSubId = g.body.submissionResult._id;
    const u = await api()
      .post(`/submission/submit/${fx.problem._id}`)
      .set(auth(userToken))
      .send({ code: "// u", language: "cpp" });
    userSubId = u.body.submissionResult._id;
  });

  const list = (token) => api().get(`/problem/submissions/${fx.problem._id}`).set(auth(token));
  const detail = (token, id) => api().get(`/submission/${id}`).set(auth(token));

  it("a guest lists only their own session", async () => {
    const a = await list(guestA);
    expect(a.status).toBe(200);
    expect(a.body.submissions.map((s) => s._id)).toEqual([guestSubId]);
    expect(a.body.total).toBe(1);
    const b = await list(guestB);
    expect(b.body.submissions).toEqual([]);
  });

  it("a guest can open their own submission, nobody else can", async () => {
    const own = await detail(guestA, guestSubId);
    expect(own.status).toBe(200);
    expect(own.body.submission.code).toBe("// a");
    expect((await detail(guestB, guestSubId)).status).toBe(404);
    expect((await detail(userToken, guestSubId)).status).toBe(404);
    expect((await detail(guestA, userSubId)).status).toBe(404);
  });

  it("users never see guest submissions in their history", async () => {
    const u = await list(userToken);
    expect(u.body.submissions.map((s) => s._id)).not.toContain(guestSubId);
  });

  it("expired guest submissions are hidden even before the TTL monitor deletes them", async () => {
    const { gid } = jwt.decode(guestA);
    await GuestSubmission.updateMany({ guestId: gid }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await list(guestA)).body.submissions).toEqual([]);
    expect((await detail(guestA, guestSubId)).status).toBe(404);
  });

  it("the collection has a TTL index on expiresAt", async () => {
    await GuestSubmission.syncIndexes();
    const indexes = await GuestSubmission.collection.indexes();
    const ttl = indexes.find((i) => i.key.expiresAt === 1);
    expect(ttl.expireAfterSeconds).toBe(0);
  });
});

describe("guest restrictions on solutions, AI tutor and stats", () => {
  it("solutions stay locked for guests, even after an Accepted guest submission", async () => {
    const token = await startGuest();
    const accepted = await api()
      .post(`/submission/submit/${fx.problem._id}`)
      .set(auth(token))
      .send({ code: "// ok", language: "cpp" });
    expect(accepted.body.submissionResult.status).toBe("Accepted");
    const res = await api().get(`/problem/${fx.problem._id}/solution`).set(auth(token));
    expect(res.status).toBe(403);
    expect(res.body.isLocked).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(MARKERS);
  });

  it("AI tutor: a guest gets 429 once the 5 per-session questions are used", async () => {
    const token = await startGuest();
    const { gid } = jwt.decode(token);
    await redis.set(`guest_ai:${gid}`, String(guestConfig.aiQuestionsPerSession));
    const res = await api()
      .post("/chatAI/doubt")
      .set(auth(token))
      .send({ problemId: String(fx.problem._id), userQuestion: "hint?", userCode: "int x;", userLanguage: "cpp" });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("GUEST_QUOTA_EXCEEDED");
    expect(res.body.error.message).toMatch(/5 questions/);
  });

  it("admin dashboard counts ignore guest activity", async () => {
    const adminToken = await login("admin@test.local", PASSWORDS.admin);
    const before = (await api().get("/admin/dashboard").set(auth(adminToken))).body;
    const token = await startGuest();
    await api().post(`/submission/submit/${fx.problem._id}`).set(auth(token)).send({ code: "// ok", language: "cpp" });
    const after = (await api().get("/admin/dashboard").set(auth(adminToken))).body;
    expect(after).toEqual(before);
  });
});
