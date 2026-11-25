import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connect, disconnect, resetData, seed, api, login, auth, PASSWORDS, MARKERS, Submission, Problem } from './helpers/app.js';

let fx;
let userToken;
let adminToken;
beforeAll(async () => {
  await connect();
  await resetData();
  fx = await seed();
  userToken = await login('user@test.local', PASSWORDS.user);
  adminToken = await login('admin@test.local', PASSWORDS.admin);
});
afterAll(disconnect);

describe('data exposure: no hidden tests, driver code, reference solutions or hashes for non-admins', () => {
  it('problem list, problem detail, solution lock, profile and check', async () => {
    const id = fx.problem._id;
    const responses = await Promise.all([
      api().get('/problem/'),
      api().get('/problem/').set(auth(userToken)),
      api().get(`/problem/${id}`).set(auth(userToken)),
      api().get(`/problem/${id}/solution`).set(auth(userToken)),
      api().get('/user/profile').set(auth(userToken)),
      api().get('/user/check').set(auth(userToken)),
      api().get(`/problem/submissions/${id}`).set(auth(userToken)),
    ]);
    for (const res of responses) {
      expect(JSON.stringify(res.body), res.req.path).not.toMatch(MARKERS);
    }
    const detail = responses[2].body.problem;
    expect(detail).not.toHaveProperty('hiddenTestCases');
    expect(detail).not.toHaveProperty('referenceSolutions');
    expect(detail.codeSnippets.every((s) => !('driverCode' in s))).toBe(true);
    expect(responses[3].status).toBe(403); // solution locked until solved
  });

  it('the admin endpoint does contain them (sanity check of the markers)', async () => {
    const res = await api().get(`/problem/${fx.problem._id}/admin`).set(auth(adminToken));
    expect(JSON.stringify(res.body)).toMatch(MARKERS);
  });
});

describe('problem list', () => {
  it('is always paginated and flags solved rows', async () => {
    const res = await api().get('/problem/').set(auth(userToken));
    expect(res.body).toMatchObject({ currentPage: 1, limit: 20 });
    expect(res.body.allProblems[0]).toHaveProperty('isSolved', false);
    expect((await api().get('/problem/?limit=all')).status).toBe(400);
    expect((await api().get('/problem/?search=a&search=b')).status).toBe(400);
  });
});

describe('stats exclude ungraded submissions (BUG-13)', () => {
  it('Pending and System Error are not counted', async () => {
    const base = { userId: fx.user._id, problemId: fx.problem._id, code: 'x', language: 'cpp' };
    await Submission.insertMany([
      { ...base, status: 'Accepted' },
      { ...base, status: 'Wrong Answer' },
      { ...base, status: 'Pending' },
      { ...base, status: 'System Error' },
    ]);
    const profile = await api().get('/user/profile').set(auth(userToken));
    expect(profile.body.stats).toMatchObject({ totalSubmissions: 2, acceptedSubmissions: 1, acceptanceRate: 50 });
    const dash = await api().get('/admin/dashboard').set(auth(adminToken));
    expect(dash.body.metrics.totalSubmissions).toBe(2);
    expect(dash.body.acceptanceRate).toBe(50);
  });
});

describe('admin problem edits (BUG-09) and numbering (BUG-16)', () => {
  it('metadata-only edit saves without Judge0; a test-case edit is re-validated', async () => {
    // A reference solution that makes the mock Judge0 "down": any Judge0 call would fail with 503
    await Problem.updateOne({ _id: fx.problem._id }, { $set: { 'referenceSolutions.0.code': '// MOCK_DOWN' } });
    const title = await api().put(`/problem/${fx.problem._id}`).set(auth(adminToken)).send({ title: 'Double It (edited)' });
    expect(title.status).toBe(200);
    expect(title.body.problem.title).toBe('Double It (edited)');
    const tests = await api()
      .put(`/problem/${fx.problem._id}`)
      .set(auth(adminToken))
      .send({ hiddenTestCases: [{ input: '1', expectedOutput: '2' }] });
    expect(tests.status).toBe(503);
  });

  it('concurrent creates get consecutive numbers', async () => {
    const make = (i) => new Problem({
      title: `Concurrent ${i}`, topics: ['T'], description: 'd', difficulty: 'Easy',
      visibleTestCase: { input: '1', expectedOutput: '1' }, problemCreator: fx.admin._id,
    }).save();
    const saved = await Promise.all([make(1), make(2), make(3)]);
    const nums = saved.map((p) => p.number).sort((a, b) => a - b);
    expect(nums[1]).toBe(nums[0] + 1);
    expect(nums[2]).toBe(nums[0] + 2);
  });
});
