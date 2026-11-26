// End-to-end API tests against the LOCAL QA stack (scripts/qa/stack.mjs backend on :3200, real local Judge0).
//   node scripts/qa/api-tests.mjs            -> prints PASS/FAIL per check, writes scripts/qa/results/api-tests.md
// Rate-limit checks reset their own rl:* keys in the LOCAL QA Redis afterwards so later checks are not blocked.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const require = createRequire(import.meta.url);
const jwt = require(path.join(root, 'backend', 'node_modules', 'jsonwebtoken'));
const { createClient } = require(path.join(root, 'backend', 'node_modules', 'redis'));
const { ACCOUNTS } = require('./fixtures.js');

const API = process.env.QA_API || 'http://localhost:3200';
const QA_JWT_KEY = 'local-qa-only-key-not-a-secret-0123456789abcdef0123'; // scripts/qa/stack.mjs
const redis = createClient({ socket: { host: '127.0.0.1', port: 6380 }, password: 'qapass' });
await redis.connect();
const clearKeys = async (pattern) => {
  for await (const keys of redis.scanIterator({ MATCH: pattern, COUNT: 200 })) {
    const list = Array.isArray(keys) ? keys : [keys];
    if (list.length) await redis.del(list);
  }
};

const results = [];
const check = (area, name, cond, detail = '') => {
  results.push({ area, name, ok: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  [${area}] ${name}${cond ? '' : `  -> ${detail}`}`);
};
const call = async (method, url, { token, body, headers = {}, raw } = {}) => {
  const h = { ...headers };
  if (body !== undefined && !raw) h['Content-Type'] = 'application/json';
  if (raw) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  const r = await fetch(`${API}${url}`, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data, headers: r.headers };
};
const msg = (r) => `${r.status} ${JSON.stringify(r.data).slice(0, 200)}`;
const login = async (a) => (await call('POST', '/user/login', { body: { email: a.email, password: a.password } })).data.token;

// ---------- setup
const adminT = await login(ACCOUNTS.admin);
const userT = await login(ACCOUNTS.user2);
const list = (await call('GET', '/problem?limit=100')).data.allProblems;
const twoSum = list.find((p) => p.slug === 'two-sum');
const ref = (slug, lang) => readFileSync(path.join(root, 'backend', 'seed', 'reference', slug, `solution.${lang}`), 'utf8');
const FAKE_ID = '0123456789abcdef01234567';

// ---------- health / misc
let r = await call('GET', '/healthz'); check('misc', 'GET /healthz 200', r.status === 200, msg(r));
r = await call('GET', '/readyz'); check('misc', 'GET /readyz 200 (mongo+redis ok)', r.status === 200, msg(r));
r = await call('GET', '/api/health'); check('misc', 'GET /api/health 200', r.status === 200, msg(r));
r = await call('GET', '/nope'); check('misc', 'unknown route 404 JSON', r.status === 404 && r.data?.error, msg(r));
r = await call('POST', '/user/login', { raw: '{"email":' }); check('misc', 'malformed JSON 400', r.status === 400, msg(r));
r = await call('POST', '/user/login', { raw: JSON.stringify({ email: 'a@b.c', password: 'x'.repeat(200 * 1024) }) }); check('misc', 'body > 100 KB 413', r.status === 413, msg(r));
r = await fetch(`${API}/problem?limit=1`, { headers: { Origin: 'https://evil.example' } });
check('cors', 'foreign Origin gets no Access-Control-Allow-Origin', !r.headers.get('access-control-allow-origin') || r.headers.get('access-control-allow-origin') === 'http://localhost:5175', r.headers.get('access-control-allow-origin'));
r = await fetch(`${API}/problem?limit=1`, { headers: { Origin: 'http://localhost:5175' } });
check('cors', 'CLIENT_URL Origin allowed', r.headers.get('access-control-allow-origin') === 'http://localhost:5175', r.headers.get('access-control-allow-origin'));
check('misc', 'helmet headers present, no x-powered-by', r.headers.get('x-content-type-options') === 'nosniff' && !r.headers.get('x-powered-by'));

// ---------- register
const stamp = Date.now();
const newUser = { firstName: 'Temp', email: `temp${stamp}@qa.oncode.test`, password: 'Temp!pass1' };
r = await call('POST', '/user/register', { body: newUser });
check('auth', 'register happy path 201 + token', r.status === 201 && r.data.token && r.data.user?.role === 'user', msg(r));
const tempT = r.data.token;
r = await call('POST', '/user/register', { body: newUser }); check('auth', 'register duplicate email 400', r.status === 400, msg(r));
r = await call('POST', '/user/register', { body: { ...newUser, email: `x${stamp}@qa.oncode.test`, password: 'weak' } }); check('auth', 'register weak password 400', r.status === 400, msg(r));
r = await call('POST', '/user/register', { body: { ...newUser, email: 'not-an-email' } }); check('auth', 'register invalid email 400', r.status === 400, msg(r));
r = await call('POST', '/user/register', { body: { ...newUser, email: `y${stamp}@qa.oncode.test`, role: 'admin' } }); check('auth', 'register with role=admin rejected 400', r.status === 400, msg(r));
r = await call('POST', '/user/register', { body: { firstName: 'X' } }); check('auth', 'register missing fields 400', r.status === 400, msg(r));
r = await call('POST', '/user/register', { body: { ...newUser, email: `z${stamp}@qa.oncode.test`, firstName: '<img src=x onerror=alert(1)> 名前' } });
check('auth', 'register with HTML/unicode name stored as text (201)', r.status === 201 && r.data.user.firstName.includes('<img'), msg(r));

// ---------- login
r = await call('POST', '/user/login', { body: { email: ACCOUNTS.user2.email, password: ACCOUNTS.user2.password } }); check('auth', 'login happy 200', r.status === 200 && r.data.token, msg(r));
r = await call('POST', '/user/login', { body: { email: ACCOUNTS.user2.email.toUpperCase(), password: ACCOUNTS.user2.password } }); check('auth', 'login email case-insensitive', r.status === 200, msg(r));
r = await call('POST', '/user/login', { body: { email: ACCOUNTS.user2.email, password: 'wrong' } }); check('auth', 'login wrong password 401', r.status === 401, msg(r));
r = await call('POST', '/user/login', { body: { email: 'nobody@qa.oncode.test', password: 'x' } }); check('auth', 'login unknown email 401 (same message)', r.status === 401 && /Invalid credentials/.test(JSON.stringify(r.data)), msg(r));
r = await call('POST', '/user/login', { body: { email: { $ne: null }, password: { $ne: null } } }); check('security', 'NoSQL injection in login rejected 400', r.status === 400, msg(r));
r = await call('POST', '/user/login', { body: {} }); check('auth', 'login missing fields 400', r.status === 400, msg(r));
await clearKeys('rl:login-*');

// ---------- tokens
const uid = jwt.decode(userT)._id;
const expired = jwt.sign({ _id: uid, email: ACCOUNTS.user2.email, role: 'user', exp: Math.floor(Date.now() / 1000) - 60 }, QA_JWT_KEY);
const forged = jwt.sign({ _id: uid, email: ACCOUNTS.user2.email, role: 'admin' }, 'some-other-key');
const noneAlg = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ _id: uid, role: 'admin' })).toString('base64url')}.`;
const roleClaim = jwt.sign({ _id: uid, email: ACCOUNTS.user2.email, role: 'admin' }, QA_JWT_KEY, { expiresIn: '1h' });
r = await call('GET', '/user/check'); check('auth', 'no token 401', r.status === 401, msg(r));
r = await call('GET', '/user/check', { token: 'garbage' }); check('auth', 'garbage token 401', r.status === 401, msg(r));
r = await call('GET', '/user/check', { token: expired }); check('auth', 'expired token 401 with expiry message', r.status === 401 && /expired/i.test(JSON.stringify(r.data)), msg(r));
r = await call('GET', '/user/check', { token: forged }); check('auth', 'token signed with other key 401', r.status === 401, msg(r));
r = await call('GET', '/user/check', { token: noneAlg }); check('security', 'alg=none token 401', r.status === 401, msg(r));
r = await call('GET', '/admin/dashboard', { token: roleClaim }); check('security', 'role=admin claim in a user token does not grant admin (403)', r.status === 403, msg(r));
r = await call('GET', '/user/check', { token: userT }); check('auth', 'valid token /user/check 200', r.status === 200 && r.data.user.email === ACCOUNTS.user2.email, msg(r));

// ---------- guest
r = await call('POST', '/user/guest'); check('guest', 'POST /user/guest 201 + token', r.status === 201 && r.data.token, msg(r));
const guestT = r.data.token;
const gPayload = jwt.decode(guestT);
check('guest', 'guest token has typ=guest, no _id/email/role, 4 h', gPayload.typ === 'guest' && !gPayload._id && !gPayload.role && gPayload.exp - gPayload.iat === 4 * 3600, JSON.stringify(gPayload));
for (const [m, u, b] of [['GET', '/user/check'], ['GET', '/user/profile'], ['DELETE', '/user/profile'], ['GET', '/problem/solved'], ['GET', '/admin/dashboard'], ['POST', '/problem', {}], ['PUT', `/problem/${twoSum._id}`, { title: 'x' }], ['DELETE', `/problem/${twoSum._id}`], ['GET', `/problem/${twoSum._id}/admin`], ['POST', '/user/admin/register', {}], ['GET', '/submission/health']]) {
  r = await call(m, u, { token: guestT, body: b });
  check('guest', `guest ${m} ${u} -> 403`, r.status === 403, msg(r));
}
r = await call('GET', `/problem/${twoSum.slug}`, { token: guestT }); check('guest', 'guest can open a problem', r.status === 200, msg(r));
r = await call('GET', `/problem/${twoSum._id}/solution`, { token: guestT }); check('guest', 'guest solution locked 403 isLocked', r.status === 403 && r.data.isLocked, msg(r));
r = await call('POST', '/user/guest', { token: guestT }); check('guest', 'second guest session allowed (new token)', r.status === 201, msg(r));
const guestT2 = r.data.token;

// ---------- problem list / filters
r = await call('GET', '/problem'); check('problems', 'list default page: 20 rows, total 75', r.status === 200 && r.data.allProblems.length === 20 && r.data.totalProblems === 75 && r.data.totalPages === 4, msg(r));
check('problems', 'list rows carry only summary fields', r.data.allProblems.every((p) => !('description' in p) && !('hiddenTestCases' in p)), Object.keys(r.data.allProblems[0]).join(','));
check('problems', 'allTopics present', Array.isArray(r.data.allTopics) && r.data.allTopics.length > 5, msg(r));
r = await call('GET', '/problem?limit=100'); check('problems', 'limit=100 returns all 75, numbered 1..75', r.data.allProblems.length === 75 && r.data.allProblems.every((p, i) => p.number === i + 1), msg(r));
r = await call('GET', '/problem?page=99'); check('problems', 'page beyond end: 200 empty', r.status === 200 && r.data.allProblems.length === 0, msg(r));
r = await call('GET', '/problem?search=sum'); check('problems', 'search "sum" finds Two Sum, 3Sum, etc.', r.data.allProblems.some((p) => p.slug === 'two-sum') && r.data.allProblems.every((p) => /sum/i.test(p.title)), msg(r));
r = await call('GET', '/problem?search=.*'); check('security', 'regex chars in search are escaped (no match-all)', r.status === 200 && r.data.totalProblems === 0, msg(r));
r = await call('GET', '/problem?search=TWO%20SUM'); check('problems', 'search is case-insensitive', r.data.allProblems.some((p) => p.slug === 'two-sum'), msg(r));
r = await call('GET', '/problem?difficulty=easy&limit=100'); check('problems', 'difficulty=easy only Easy', r.data.allProblems.length > 0 && r.data.allProblems.every((p) => p.difficulty === 'Easy'), msg(r));
const easy = r.data.totalProblems;
r = await call('GET', '/problem?difficulty=medium&limit=100'); const med = r.data.totalProblems;
r = await call('GET', '/problem?difficulty=hard&limit=100'); check('problems', 'easy+medium+hard = 75', easy + med + r.data.totalProblems === 75, `${easy}+${med}+${r.data.totalProblems}`);
const topic = list[0].topics[0];
r = await call('GET', `/problem?topic=${encodeURIComponent(topic)}&limit=100`); check('problems', `topic filter "${topic}"`, r.data.allProblems.length > 0 && r.data.allProblems.every((p) => p.topics.includes(topic)), msg(r));
r = await call('GET', `/problem?topic=${encodeURIComponent(topic.toUpperCase())}&limit=100`); check('problems', 'topic filter case-insensitive', r.data.allProblems.length > 0, msg(r));
r = await call('GET', '/problem?difficulty=insane'); check('validation', 'bad difficulty 400', r.status === 400, msg(r));
r = await call('GET', '/problem?limit=1000'); check('validation', 'limit=1000 400', r.status === 400, msg(r));
r = await call('GET', '/problem?search=a&search=b'); check('validation', 'repeated search param 400', r.status === 400, msg(r));
r = await call('GET', '/problem?page=0'); check('validation', 'page=0 400', r.status === 400, msg(r));
r = await call('GET', '/problem?status=solved'); check('problems', 'status=solved anonymous ignored (all)', r.status === 200 && r.data.totalProblems === 75, msg(r));

// ---------- single problem
r = await call('GET', `/problem/${twoSum.slug}`); check('problems', 'GET /problem/:slug without token 401', r.status === 401, msg(r));
r = await call('GET', `/problem/${twoSum.slug}`, { token: userT });
const pub = r.data.problem;
check('problems', 'GET /problem/:slug 200', r.status === 200 && pub.slug === 'two-sum', msg(r));
check('security', 'public problem has no hiddenTestCases / referenceSolutions / driverCode', pub && !pub.hiddenTestCases && !pub.referenceSolutions && pub.codeSnippets.every((s) => !s.driverCode), Object.keys(pub || {}).join(','));
check('problems', 'public problem has cpp+java starters, examples, visible test', pub.codeSnippets.length === 2 && pub.examples.length > 0 && pub.visibleTestCase, msg(r));
r = await call('GET', `/problem/${twoSum._id}`, { token: userT }); check('problems', 'GET /problem/:_id (legacy) 200', r.status === 200 && r.data.problem.slug === 'two-sum', msg(r));
r = await call('GET', '/problem/TWO-SUM', { token: userT }); check('problems', 'slug lookup case-insensitive', r.status === 200, msg(r));
r = await call('GET', '/problem/no-such-problem', { token: userT }); check('problems', 'unknown slug 404', r.status === 404, msg(r));
r = await call('GET', `/problem/${FAKE_ID}`, { token: userT }); check('problems', 'unknown id 404', r.status === 404, msg(r));
r = await call('GET', '/problem/bad%20slug!!', { token: userT }); check('validation', 'malformed slug 400', r.status === 400, msg(r));
r = await call('GET', `/problem/${twoSum._id}/admin`, { token: userT }); check('authz', 'user GET /problem/:id/admin 403', r.status === 403, msg(r));
r = await call('GET', `/problem/${twoSum._id}/admin`, { token: adminT }); check('authz', 'admin GET /problem/:id/admin 200 with hidden tests', r.status === 200 && r.data.problem.hiddenTestCases.length > 0, msg(r));
r = await call('GET', `/problem/${twoSum._id}/solution`, { token: userT }); check('authz', 'unsolved user: solution locked 403', r.status === 403 && r.data.isLocked, msg(r));
r = await call('GET', `/problem/${twoSum._id}/solution`, { token: adminT }); check('authz', 'admin: solution 200', r.status === 200 && r.data.referenceSolutions.length === 2, msg(r));
r = await call('GET', '/problem/solved', { token: userT }); check('problems', 'GET /problem/solved user 200', r.status === 200 && Array.isArray(r.data.solvedProblems), msg(r));

// ---------- run / submit (real local Judge0)
r = await call('POST', `/submission/run/${twoSum._id}`, { token: userT, body: { language: 'cpp', code: ref('two-sum', 'cpp') } });
check('judge', 'run (user, cpp, correct) 200 Accepted on visible test', r.status === 200 && r.data.status === 'Accepted' && r.data.input && r.data.expectedOutput, msg(r));
r = await call('POST', `/submission/run/${twoSum._id}`, { token: guestT, body: { language: 'java', code: ref('two-sum', 'java') } });
check('judge', 'run (guest, java, correct) 200 Accepted', r.status === 200 && r.data.status === 'Accepted', msg(r));
r = await call('POST', `/submission/run/${twoSum._id}`, { token: userT, body: { language: 'python', code: 'x' } }); check('validation', 'run unsupported language 400', r.status === 400, msg(r));
r = await call('POST', `/submission/run/${twoSum._id}`, { token: userT, body: { language: 'cpp', code: 'x'.repeat(64001) } }); check('validation', 'run code > 64k chars 413', r.status === 413, msg(r));
r = await call('POST', `/submission/run/${twoSum._id}`, { token: userT, body: { language: 'cpp' } }); check('validation', 'run missing code 400', r.status === 400, msg(r));
r = await call('POST', `/submission/run/${FAKE_ID}`, { token: userT, body: { language: 'cpp', code: 'x' } }); check('validation', 'run unknown problem 404', r.status === 404, msg(r));
r = await call('POST', '/submission/run/not-an-id', { token: userT, body: { language: 'cpp', code: 'x' } }); check('validation', 'run bad id 400', r.status === 400, msg(r));
r = await call('POST', `/submission/run/${twoSum._id}`, { body: { language: 'cpp', code: 'x' } }); check('auth', 'run without token 401', r.status === 401, msg(r));
const unicodeCode = ref('two-sum', 'cpp') + '\n// unicode: नमस्ते 你好 🚀 "quotes" \\ backslash $& $1 {{USER_CODE}}\n';
r = await call('POST', `/submission/run/${twoSum._id}`, { token: userT, body: { language: 'cpp', code: unicodeCode } });
check('judge', 'unicode / $& / {{USER_CODE}} inside user code still Accepted', r.status === 200 && r.data.status === 'Accepted', msg(r));

r = await call('POST', `/submission/submit/${twoSum._id}`, { token: userT, body: { language: 'cpp', code: ref('two-sum', 'cpp') } });
const sub = r.data.submissionResult;
check('judge', 'submit (user) 201 Accepted 10/10', r.status === 201 && sub.status === 'Accepted' && sub.testCasesPassed === sub.testCasesTotal, msg(r));
check('security', 'submit response has no hidden test data / errorDetail', sub && !('failedTestCase' in sub) && !('errorDetail' in sub) && !('code' in sub), Object.keys(sub || {}).join(','));
r = await call('POST', `/submission/submit/${twoSum._id}`, { token: userT, body: { language: 'cpp', code: readFileSync(path.join(root, 'backend/seed/reference/two-sum/wrong-same-index.cpp'), 'utf8') } });
check('judge', 'submit wrong answer -> Wrong Answer, no hidden input leaked', r.data.submissionResult?.status === 'Wrong Answer' && !JSON.stringify(r.data).includes('expectedOutput'), msg(r));
r = await call('GET', `/problem/${twoSum._id}/solution`, { token: userT }); check('authz', 'after Accepted: solution unlocked 200', r.status === 200, msg(r));
r = await call('GET', '/problem?status=solved', { token: userT }); check('problems', 'status=solved lists two-sum', r.data.allProblems.some((p) => p.slug === 'two-sum'), msg(r));
r = await call('GET', '/problem?status=unsolved&limit=100', { token: userT }); check('problems', 'status=unsolved excludes two-sum', !r.data.allProblems.some((p) => p.slug === 'two-sum') && r.data.totalProblems === 74, msg(r));
r = await call('GET', '/user/profile', { token: userT }); check('profile', 'profile stats count solve + submissions', r.status === 200 && r.data.stats.totalSolved >= 1 && r.data.stats.totalSubmissions >= 2 && r.data.stats.totalPlatformProblems === 75, msg(r));
r = await call('GET', `/problem/submissions/${twoSum._id}`, { token: userT }); check('history', 'user submission history 200, no code in rows', r.status === 200 && r.data.submissions.length >= 2 && r.data.submissions.every((s) => !('code' in s)), msg(r));
r = await call('GET', `/submission/${sub?._id}`, { token: userT }); check('history', 'owner GET /submission/:id 200 with code', r.status === 200 && r.data.submission.code, msg(r));
const otherT = await login(ACCOUNTS.user);
r = await call('GET', `/submission/${sub?._id}`, { token: otherT }); check('security', 'IDOR: other user GET /submission/:id -> 404', r.status === 404, msg(r));
r = await call('GET', `/submission/${sub?._id}`, { token: guestT }); check('security', 'IDOR: guest GET user submission -> 404', r.status === 404, msg(r));
r = await call('GET', `/submission/${sub?._id}`, { token: adminT }); check('security', 'admin cannot read other users submission via owner route (404)', r.status === 404, msg(r));

r = await call('POST', `/submission/submit/${twoSum._id}`, { token: guestT, body: { language: 'cpp', code: ref('two-sum', 'cpp') } });
const gsub = r.data.submissionResult;
check('guest', 'guest submit 201 Accepted', r.status === 201 && gsub?.status === 'Accepted', msg(r));
r = await call('GET', `/problem/submissions/${twoSum._id}`, { token: guestT }); check('guest', 'guest sees own session submission', r.data.submissions?.length === 1, msg(r));
r = await call('GET', `/problem/submissions/${twoSum._id}`, { token: guestT2 }); check('guest', 'other guest session sees none', r.data.submissions?.length === 0, msg(r));
r = await call('GET', `/submission/${gsub?._id}`, { token: guestT2 }); check('security', 'IDOR: other guest GET guest submission 404', r.status === 404, msg(r));
r = await call('GET', `/submission/${gsub?._id}`, { token: userT }); check('security', 'IDOR: user GET guest submission 404', r.status === 404, msg(r));
r = await call('GET', `/problem/${twoSum._id}/solution`, { token: guestT }); check('guest', 'guest Accepted does not unlock solution', r.status === 403, msg(r));
r = await call('GET', '/admin/dashboard', { token: adminT });
const dash1 = r.data;
check('admin', 'dashboard 200, 75 problems', r.status === 200 && dash1.metrics.totalProblems === 75, msg(r));

// ---------- logout
const logoutT = await login(ACCOUNTS.user2);
r = await call('POST', '/user/logout', { token: logoutT }); check('auth', 'logout 200', r.status === 200, msg(r));
r = await call('GET', '/user/check', { token: logoutT }); check('auth', 'token revoked after logout 401', r.status === 401, msg(r));
r = await call('POST', '/user/logout', { token: guestT2 }); check('guest', 'guest exit (logout) 200', r.status === 200, msg(r));
r = await call('GET', `/problem/${twoSum.slug}`, { token: guestT2 }); check('guest', 'revoked guest token 401 GUEST_SESSION_ENDED', r.status === 401, msg(r));

// ---------- admin CRUD
const full = (await call('GET', `/problem/${twoSum._id}/admin`, { token: adminT })).data.problem;
const strip = ({ _id, number, slug, ...rest }) => JSON.parse(JSON.stringify(rest, (k, v) => (k === '_id' ? undefined : v)));
const newProblem = { ...strip(full), title: `QA Temp Problem ${stamp}`, slug: `qa-temp-${stamp}` };
r = await call('POST', '/problem', { token: userT, body: newProblem }); check('authz', 'user POST /problem 403', r.status === 403, msg(r));
r = await call('POST', '/problem', { token: adminT, body: { title: 'x' } }); check('validation', 'admin POST /problem invalid body 400', r.status === 400, msg(r));
r = await call('POST', '/problem', { token: adminT, body: { ...newProblem, title: 'Two Sum' } }); check('validation', 'admin POST duplicate title 400', r.status === 400, msg(r));
r = await call('POST', '/problem', { token: adminT, body: { ...newProblem, referenceSolutions: [{ language: 'cpp', code: 'class Solution { public: vector<int> twoSum(vector<int>& n, int t) { return {0,0}; } };' }] } });
check('admin', 'create with wrong reference solution rejected by Judge0 validation 400', r.status === 400 && /Reference Solution Error/.test(JSON.stringify(r.data)), msg(r));
r = await call('POST', '/problem', { token: adminT, body: newProblem });
const created = r.data.problem;
check('admin', 'admin create problem (Judge0-validated) 201', r.status === 201 && created?.slug === newProblem.slug && created.number === 76, msg(r));
check('cache', 'topics cache invalidated on create', !(await redis.exists('topics:v1')), 'topics:v1 still present');
await call('GET', '/problem'); check('cache', 'topics cache repopulated on list', !!(await redis.exists('topics:v1')));
if (created) {
  r = await call('PUT', `/problem/${created._id}`, { token: userT, body: { title: 'hack' } }); check('authz', 'user PUT /problem 403', r.status === 403, msg(r));
  r = await call('PUT', `/problem/${created._id}`, { token: adminT, body: { title: `QA Temp Renamed ${stamp}`, topics: ['QA Topic'] } });
  check('admin', 'admin metadata update 200, slug kept', r.status === 200 && r.data.problem.slug === newProblem.slug, msg(r));
  r = await call('GET', '/problem'); check('cache', 'new topic visible after update (cache invalidated)', r.data.allTopics.includes('QA Topic'), r.data.allTopics.join(','));
  r = await call('PUT', `/problem/${FAKE_ID}`, { token: adminT, body: { title: 'x' } }); check('admin', 'PUT unknown id 404', r.status === 404, msg(r));
  r = await call('PUT', '/problem/bad', { token: adminT, body: { title: 'x' } }); check('validation', 'PUT bad id 400', r.status === 400, msg(r));
  // a user submission on the temp problem must be cleaned up by the cascade
  await call('POST', `/submission/submit/${created._id}`, { token: userT, body: { language: 'cpp', code: ref('two-sum', 'cpp') } });
  r = await call('DELETE', `/problem/${created._id}`, { token: userT }); check('authz', 'user DELETE /problem 403', r.status === 403, msg(r));
  r = await call('DELETE', `/problem/${created._id}`, { token: adminT }); check('admin', 'admin DELETE /problem 200', r.status === 200, msg(r));
  r = await call('GET', `/problem/submissions/${created._id}`, { token: userT }); check('stale', 'submissions cascaded on problem delete', r.data.submissions?.length === 0, msg(r));
  r = await call('GET', '/problem/solved', { token: userT }); check('stale', 'problemsSolved pulled on problem delete', !r.data.solvedProblems.some((p) => String(p._id) === String(created._id)), msg(r));
  r = await call('GET', '/problem'); check('cache', 'deleted problem topic gone (cache invalidated)', !r.data.allTopics.includes('QA Topic'), r.data.allTopics.join(','));
  r = await call('DELETE', `/problem/${created._id}`, { token: adminT }); check('admin', 'DELETE again 404', r.status === 404, msg(r));
}
r = await call('POST', '/user/admin/register', { token: userT, body: { firstName: 'A', email: `a${stamp}@qa.oncode.test`, password: 'Temp!pass1', role: 'admin' } }); check('authz', 'user POST /user/admin/register 403', r.status === 403, msg(r));
r = await call('POST', '/user/admin/register', { token: adminT, body: { firstName: 'Made', email: `made${stamp}@qa.oncode.test`, password: 'Temp!pass1', role: 'user' } }); check('admin', 'admin registers user 201', r.status === 201, msg(r));
r = await call('GET', '/admin/dashboard', { token: userT }); check('authz', 'user GET /admin/dashboard 403', r.status === 403, msg(r));
r = await call('GET', '/admin/dashboard'); check('authz', 'anonymous GET /admin/dashboard 401', r.status === 401, msg(r));
r = await call('GET', '/submission/health', { token: adminT }); check('admin', 'admin Judge0 health 200 online', r.status === 200 && r.data.isOnline, msg(r));
check('security', 'Judge0 health has no host/port', !/localhost|2358|127\.0\.0\.1/.test(JSON.stringify(r.data)), JSON.stringify(r.data));
r = await call('GET', '/submission/health', { token: userT }); check('authz', 'user GET /submission/health 403', r.status === 403, msg(r));

// ---------- delete profile cascades
await call('POST', `/submission/submit/${twoSum._id}`, { token: tempT, body: { language: 'cpp', code: 'bad code' } });
r = await call('DELETE', '/user/profile', { token: tempT }); check('profile', 'DELETE /user/profile 200', r.status === 200, msg(r));
r = await call('GET', '/user/check', { token: tempT }); check('profile', 'deleted user token 401', r.status === 401, msg(r));

// ---------- AI tutor (real Gemini, 2 calls)
r = await call('POST', '/chatAI/doubt', { token: userT, body: { problemId: twoSum._id, userQuestion: 'Is my approach O(n)? Answer in one sentence.', userCode: ref('two-sum', 'cpp'), userLanguage: 'cpp' } });
check('ai', 'AI tutor (user) 200 with reply', r.status === 200 && typeof r.data.reply === 'string' && r.data.reply.length > 0, msg(r));
r = await call('POST', '/chatAI/doubt', { token: guestT, body: { problemId: twoSum._id, userQuestion: 'One-word hint?', userCode: 'int main(){}', userLanguage: 'cpp' } });
check('ai', 'AI tutor (guest) 200 and charged guest quota', r.status === 200 && (await redis.get(`guest_ai:${gPayload.gid}`)) === '1', msg(r));
r = await call('POST', '/chatAI/doubt', { token: userT, body: { problemId: twoSum._id, userQuestion: '', userCode: 'x' } }); check('validation', 'AI empty question 400', r.status === 400, msg(r));
r = await call('POST', '/chatAI/doubt', { token: userT, body: { problemId: twoSum._id, userQuestion: 'x'.repeat(1001), userCode: 'x' } }); check('validation', 'AI question > 1000 chars 400', r.status === 400, msg(r));
r = await call('POST', '/chatAI/doubt', { body: { problemId: twoSum._id, userQuestion: 'x', userCode: 'x' } }); check('auth', 'AI without token 401', r.status === 401, msg(r));

// ---------- rate limits (each resets its keys afterwards)
const hammer = async (n, fn) => { let last; for (let i = 0; i < n; i++) last = await fn(i); return last; };
await clearKeys('rl:login-*');
r = await hammer(6, () => call('POST', '/user/login', { body: { email: ACCOUNTS.user.email, password: 'wrong' } }));
check('ratelimit', 'login: 6th failed attempt for one email 429', r.status === 429, msg(r));
r = await call('POST', '/user/login', { body: { email: ACCOUNTS.user2.email, password: ACCOUNTS.user2.password } }); check('ratelimit', 'login: other account on same IP unaffected', r.status === 200, msg(r));
await clearKeys('rl:login-*');
r = await hammer(51, (i) => call('POST', '/user/login', { body: { email: `spray${i}@qa.oncode.test`, password: 'x' } })); check('ratelimit', 'login: 51st attempt from one IP 429', r.status === 429, msg(r));
await clearKeys('rl:login-*');
await clearKeys('rl:register:*');
r = await hammer(11, (i) => call('POST', '/user/register', { body: { firstName: 'R', email: `rl${stamp}-${i}@qa.oncode.test`, password: 'weak' } }));
check('ratelimit', 'register: 11th attempt in 15 min 429', r.status === 429, msg(r));
await clearKeys('rl:register:*');
await clearKeys('rl:guest-session:*');
r = await hammer(11, () => call('POST', '/user/guest')); check('ratelimit', 'guest: 11th session per IP per hour 429', r.status === 429, msg(r));
await clearKeys('rl:guest-session:*');
await clearKeys('rl:submit:*');
r = await hammer(51, () => call('POST', `/submission/run/${FAKE_ID}`, { token: userT, body: { language: 'cpp', code: 'x' } })); check('ratelimit', 'run/submit: 51st request in 15 min 429', r.status === 429, msg(r));
await clearKeys('rl:submit:*');
await clearKeys('rl:ai-*');
r = await hammer(11, () => call('POST', '/chatAI/doubt', { token: userT, body: { problemId: FAKE_ID, userQuestion: 'x', userCode: 'x' } })); check('ratelimit', 'AI: 11th question per user per 10 min 429', r.status === 429, msg(r));
await clearKeys('rl:ai-*');

// ---------- report
const outDir = path.join(here, 'results');
mkdirSync(outDir, { recursive: true });
const failed = results.filter((x) => !x.ok);
const md = ['| area | check | result | detail |', '|---|---|---|---|', ...results.map((x) => `| ${x.area} | ${x.name} | ${x.ok ? 'PASS' : '**FAIL**'} | ${x.ok ? '' : String(x.detail).replace(/\|/g, '\\|').slice(0, 200)} |`), '', `${results.length} checks, ${results.length - failed.length} PASS, ${failed.length} FAIL. ${new Date().toISOString()}`];
writeFileSync(path.join(outDir, 'api-tests.md'), md.join('\n') + '\n');
console.log(`\n${results.length} checks, ${results.length - failed.length} PASS, ${failed.length} FAIL`);
await redis.quit();
