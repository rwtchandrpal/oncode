import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connect, disconnect, resetData, seed, api, login, auth, PASSWORDS, MARKERS, Submission, User } from './helpers/app.js';

let fx;
let userToken;
let otherToken;
const submit = (code, language = 'cpp', token = userToken) =>
  api().post(`/submission/submit/${fx.problem._id}`).set(auth(token)).send({ code, language });

beforeAll(async () => {
  await connect();
  await resetData();
  fx = await seed();
  userToken = await login('user@test.local', PASSWORDS.user);
  otherToken = await login('other@test.local', PASSWORDS.other);
});
afterAll(disconnect);

describe('submit with a mocked Judge0', () => {
  it('Accepted: counts all tests and marks the problem solved', async () => {
    const res = await submit('// correct');
    expect(res.status).toBe(201);
    expect(res.body.submissionResult).toMatchObject({ status: 'Accepted', testCasesPassed: 2, testCasesTotal: 2 });
    const user = await User.findById(fx.user._id).lean();
    expect(user.problemsSolved.map(String)).toContain(String(fx.problem._id));
  });

  it('Wrong Answer: response has no hidden input/expected output; the DB keeps it for admins', async () => {
    const res = await submit('// MOCK_WA');
    expect(res.status).toBe(201);
    expect(res.body.submissionResult.status).toBe('Wrong Answer');
    expect(JSON.stringify(res.body)).not.toMatch(MARKERS);
    expect(res.body.submissionResult).not.toHaveProperty('failedTestCase');
    expect(res.body.submissionResult).not.toHaveProperty('code');
    const stored = await Submission.findById(res.body.submissionResult._id).select('+failedTestCase').lean();
    expect(stored.failedTestCase.input).toMatch(/HIDDEN_INPUT_MARKER/);
  });

  it('Compilation Error: returns the compiler output', async () => {
    const res = await submit('// MOCK_CE');
    expect(res.body.submissionResult.status).toBe('Compilation Error');
    expect(res.body.submissionResult.errorMessage).toMatch(/mock compile error/);
  });

  it('Runtime Error: stderr that echoes the hidden input is not returned', async () => {
    const res = await submit('// MOCK_RE');
    expect(res.body.submissionResult.status).toMatch(/Runtime Error/);
    expect(res.body.submissionResult.errorMessage).toMatch(/hidden test case 1/);
    expect(JSON.stringify(res.body)).not.toMatch(/echo:|HIDDEN_/);
  });

  it('Judge0 down: 503 with a generic message and no Pending (or any) record', async () => {
    const before = await Submission.countDocuments();
    const res = await submit('// MOCK_DOWN');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('EXECUTION_UNAVAILABLE');
    expect(res.body.error.message).not.toMatch(/judge0|127\.0\.0\.1|:\d{2,5}/i);
    expect(await Submission.countDocuments({ status: 'Pending' })).toBe(0);
    expect(await Submission.countDocuments()).toBe(before);
  });

  it('Run with Judge0 down: 503', async () => {
    const res = await api().post(`/submission/run/${fx.problem._id}`).set(auth(userToken)).send({ code: '// MOCK_DOWN', language: 'cpp' });
    expect(res.status).toBe(503);
  });

  it('Run returns the visible test only', async () => {
    const res = await api().post(`/submission/run/${fx.problem._id}`).set(auth(userToken)).send({ code: '// MOCK_WA', language: 'java' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'Wrong Answer', input: '3', expectedOutput: '6' });
  });

  it('rejects oversized code with 413 before any DB write, and bad input with 400', async () => {
    const before = await Submission.countDocuments();
    expect((await submit('x'.repeat(64001))).status).toBe(413);
    expect(await Submission.countDocuments()).toBe(before);
    expect((await submit('x', 'python')).status).toBe(400);
    expect((await api().post('/submission/submit/not-an-id').set(auth(userToken)).send({ code: 'x', language: 'cpp' })).status).toBe(400);
  });
});

describe('submission history', () => {
  it('list has no code; detail is owner-only', async () => {
    const list = await api().get(`/problem/submissions/${fx.problem._id}`).set(auth(userToken));
    expect(list.status).toBe(200);
    expect(list.body.submissions.length).toBeGreaterThan(0);
    expect(list.body.submissions.every((s) => !('code' in s))).toBe(true);
    const id = list.body.submissions[0]._id;
    const mine = await api().get(`/submission/${id}`).set(auth(userToken));
    expect(mine.status).toBe(200);
    expect(mine.body.submission.code).toEqual(expect.any(String));
    expect(JSON.stringify(mine.body)).not.toMatch(MARKERS);
    expect((await api().get(`/submission/${id}`).set(auth(otherToken))).status).toBe(404);
  });
});
