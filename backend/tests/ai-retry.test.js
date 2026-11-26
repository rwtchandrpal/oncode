// AI tutor: retry of temporary Gemini errors (utils/retry.js, utils/geminiClient.js).
// Gemini is never called for real: ai.models.generateContent is replaced with a spy.
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { createRequire } from "node:module";
import { connect, disconnect, resetData, seed, api, login, auth, PASSWORDS, redis } from "./helpers/app.js";

const require = createRequire(import.meta.url);
const { withRetry } = require("../src/utils/retry.js");
const gemini = require("../src/utils/geminiClient.js");

const geminiError = (status) => Object.assign(new Error(`gemini ${status}`), { status });
const noSleep = () => Promise.resolve();

describe("withRetry", () => {
  it("returns the first success without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    expect(await withRetry(fn, { isRetryable: () => true, sleep: noSleep })).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries retryable errors and returns the later success", async () => {
    const fn = vi.fn().mockRejectedValueOnce(geminiError(503)).mockRejectedValueOnce(geminiError(503)).mockResolvedValue("ok");
    const onRetry = vi.fn();
    expect(await withRetry(fn, { attempts: 3, isRetryable: (e) => e.status === 503, onRetry, sleep: noSleep })).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it("stops after the last attempt and rethrows the original error", async () => {
    const err = geminiError(503);
    const fn = vi.fn().mockRejectedValue(err);
    await expect(withRetry(fn, { attempts: 3, isRetryable: () => true, sleep: noSleep })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry errors that are not retryable", async () => {
    const fn = vi.fn().mockRejectedValue(geminiError(400));
    await expect(withRetry(fn, { attempts: 3, isRetryable: (e) => e.status === 503, sleep: noSleep })).rejects.toMatchObject({ status: 400 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("backs off exponentially with jitter", async () => {
    const delays = [];
    const fn = vi.fn().mockRejectedValue(geminiError(503));
    await expect(
      withRetry(fn, { attempts: 3, baseDelayMs: 100, isRetryable: () => true, sleep: (ms) => { delays.push(ms); return Promise.resolve(); } })
    ).rejects.toBeTruthy();
    expect(delays).toHaveLength(2);
    expect(delays[0]).toBeGreaterThanOrEqual(100);
    expect(delays[0]).toBeLessThanOrEqual(150);
    expect(delays[1]).toBeGreaterThanOrEqual(200);
    expect(delays[1]).toBeLessThanOrEqual(300);
  });
});

describe("Gemini retry policy", () => {
  it("retries temporary server errors only, never 429 or other 4xx", () => {
    for (const s of [500, 502, 503, 504]) expect(gemini.isRetryableGeminiError(geminiError(s))).toBe(true);
    for (const s of [400, 401, 403, 404, 429]) expect(gemini.isRetryableGeminiError(geminiError(s))).toBe(false);
    expect(gemini.isRetryableGeminiError(new Error("network"))).toBe(false);
  });

  it("uses gemini-3.5-flash-lite", () => {
    expect(gemini.GEMINI_MODEL).toBe("gemini-3.5-flash-lite");
  });
});

describe("POST /chatAI/doubt with Gemini failures", () => {
  let fx;
  let token;
  let spy;
  const ask = (t = token) =>
    api().post("/chatAI/doubt").set(auth(t)).send({ problemId: String(fx.problem._id), userQuestion: "hint?", userCode: "int x;", userLanguage: "cpp" });

  beforeAll(async () => {
    await connect();
    await resetData();
    fx = await seed();
    token = await login("user@test.local", PASSWORDS.user);
    gemini.geminiRetryPolicy.baseDelayMs = 1;
  });
  afterAll(async () => {
    gemini.geminiRetryPolicy.baseDelayMs = 500;
    await disconnect();
  });
  afterEach(() => spy?.mockRestore());

  it("a 503 'high demand' followed by success answers 200, with the configured model", async () => {
    spy = vi.spyOn(gemini.ai.models, "generateContent")
      .mockRejectedValueOnce(geminiError(503))
      .mockResolvedValue({ text: "Check your loop bounds." });
    const res = await ask();
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe("Check your loop bounds.");
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0][0].model).toBe("gemini-3.5-flash-lite");
    expect(spy.mock.calls[0][0].config.systemInstruction).toMatch(/DO NOT provide the complete working solution/);
  });

  it("three 503s in a row answer 503 'AI tutor is busy' after 3 attempts", async () => {
    spy = vi.spyOn(gemini.ai.models, "generateContent").mockRejectedValue(geminiError(503));
    const res = await ask();
    expect(res.status).toBe(503);
    expect(res.body.error.message).toMatch(/AI tutor is busy/);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("429 (rate limit / quota) is not retried", async () => {
    spy = vi.spyOn(gemini.ai.models, "generateContent").mockRejectedValue(geminiError(429));
    const res = await ask();
    expect(res.status).toBe(503);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("other errors are not retried and answer 500", async () => {
    spy = vi.spyOn(gemini.ai.models, "generateContent").mockRejectedValue(geminiError(400));
    const res = await ask();
    expect(res.status).toBe(500);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("a guest's question is refunded when every attempt fails", async () => {
    const keys = await redis.keys("rl:guest-session:*");
    if (keys.length) await redis.del(keys);
    const guestToken = (await api().post("/user/guest")).body.token;
    const gid = JSON.parse(Buffer.from(guestToken.split(".")[1], "base64url").toString()).gid;
    spy = vi.spyOn(gemini.ai.models, "generateContent").mockRejectedValue(geminiError(503));
    const res = await ask(guestToken);
    expect(res.status).toBe(503);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(Number(await redis.get(`guest_ai:${gid}`))).toBe(0);
  });
});
