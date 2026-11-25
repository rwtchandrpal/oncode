// Phase 3 API tests, batch 1: auth, injection, authorization, data exposure.
// LOCAL ONLY (http://localhost:3100). Output is appended to audit/raw/api-tests.txt by the caller.
const B = 'http://localhost:3100';
const out = [];
const log = (...a) => { const s = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); out.push(s); console.log(s); };
const req = async (method, path, { token, body, raw, headers = {} } = {}) => {
  const t0 = performance.now();
  const r = await fetch(B + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const ms = Math.round(performance.now() - t0);
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, ms, json, text, headers: r.headers };
};
const short = (j) => JSON.stringify(j).slice(0, 220);
const MARKERS = /HIDDEN_INPUT_MARKER|HIDDEN_OUTPUT_MARKER|DRIVER_SECRET_MARKER|REFERENCE_SECRET_MARKER|"password"|\$2[aby]\$/;

const login = async (email, password) => (await req('POST', '/user/login', { body: { email, password } }));

log('=== AUTH ===');
const A = await login('admin@audit.test', 'AuditAdmin#2026');
const U = await login('user@audit.test', 'AuditUser#2026');
const O = await login('other@audit.test', 'OtherUser#2026');
log('login admin', A.status, 'user', U.status, 'other', O.status, '| response keys', Object.keys(A.json), '| user keys', Object.keys(A.json.user));
const tA = A.json.token, tU = U.json.token, tO = O.json.token;
log('JWT payload (user):', JSON.parse(Buffer.from(tU.split('.')[1], 'base64url').toString()));

log('login uppercase email:', (await login('USER@AUDIT.TEST', 'AuditUser#2026')).status);
const wrongPw = await login('user@audit.test', 'Wrong#Pass1');
const noUser = await login('nobody@audit.test', 'Wrong#Pass1');
log('wrong password ->', wrongPw.status, short(wrongPw.json), `${wrongPw.ms}ms`, '| nonexistent user ->', noUser.status, short(noUser.json), `${noUser.ms}ms`);

log('=== NOSQL INJECTION (login) ===');
let r = await req('POST', '/user/login', { body: { email: { $ne: null }, password: { $ne: null } } });
log('{email:{$ne:null},password:{$ne:null}} ->', r.status, short(r.json));
r = await req('POST', '/user/login', { body: { email: { $ne: null }, password: 'AuditAdmin#2026' } });
log('{email:{$ne:null},password:<admin pw>} ->', r.status, short(r.json), '(200 means the operator reached MongoDB and the first matching user was returned)');
r = await req('POST', '/user/login', { body: { email: { $regex: '^adm' }, password: 'x' } });
log('{email:{$regex:"^adm"},password:"x"} ->', r.status, short(r.json), `${r.ms}ms`);
r = await req('POST', '/user/login', { body: { email: { $regex: '^zzz' }, password: 'x' } });
log('{email:{$regex:"^zzz"},password:"x"} ->', r.status, short(r.json), `${r.ms}ms`, '(timing gap = blind regex enumeration of emails)');

log('=== REGISTER ===');
r = await req('POST', '/user/register', { body: { firstName: 'Evil', email: 'evil1@audit.test', password: 'Evil#Pass123', role: 'admin' } });
log('register with role:"admin" ->', r.status, 'role in response =', r.json.user?.role);
r = await req('POST', '/user/register', { body: { firstName: 'Evil', email: 'evil2@audit.test', password: 'Evil#Pass123', problemsSolved: ['000000000000000000000001'] } });
log('register with problemsSolved ->', r.status, short(r.json));
r = await req('POST', '/user/register', { body: { firstName: 'Dup', email: 'user@audit.test', password: 'Dup#Pass1234' } });
log('register duplicate email ->', r.status, short(r.json), '(enumeration)');
r = await req('POST', '/user/register', { body: { firstName: 'Weak', email: 'weak@audit.test', password: 'password' } });
log('register weak password ->', r.status, short(r.json));
r = await req('POST', '/user/register', { body: { email: '', password: '' } });
log('register empty ->', r.status, short(r.json));
r = await req('POST', '/user/register', { body: { firstName: 'L'.repeat(51), email: 'long@audit.test', password: 'Long#Pass123' } });
log('register firstName 51 chars ->', r.status, short(r.json));
const bigPw = 'Aa1#' + 'x'.repeat(200_000);
r = await req('POST', '/user/register', { body: { firstName: 'Big', email: 'bigpw@audit.test', password: bigPw } });
log('register 200KB password ->', r.status, short(r.json), `${r.ms}ms`);
r = await req('POST', '/user/login', { body: { email: 'bigpw@audit.test', password: 'Aa1#' + 'x'.repeat(68) + 'DIFFERENT_SUFFIX' } });
log('login with different password sharing first 72 bytes ->', r.status, short(r.json), '(200 = bcrypt 72-byte truncation)');
r = await req('POST', '/user/register', { body: { firstName: 'Mixed', email: 'Mixed.Case@Audit.Test', password: 'Mixed#Pass123' } });
log('register mixed-case email ->', r.status, 'stored email =', r.json.user?.email);
r = await req('POST', '/user/register', { body: { firstName: '<img src=x onerror=alert(1)>', email: 'xssname@audit.test', password: 'Xss#Pass1234' } });
log('register HTML in firstName ->', r.status, 'stored firstName =', r.json.user?.firstName);
r = await req('POST', '/user/register', { raw: '{"firstName": "bad json"', headers: {} });
log('malformed JSON body ->', r.status, short(r.json));

log('=== AUTHORIZATION: normal user -> admin endpoints ===');
const pid = (await req('GET', '/problem/?limit=all')).json.allProblems[0]._id;
for (const [m, p, b] of [['GET', '/admin/dashboard'], ['POST', '/problem/', { title: 'x' }], ['PUT', `/problem/${pid}`, { title: 'pwn' }], ['DELETE', `/problem/${pid}`], ['POST', '/user/admin/register', { firstName: 'a', email: 'a@a.test', password: 'Aa#12345678', role: 'admin' }]]) {
  const asUser = await req(m, p, { token: tU, body: b });
  const anon = await req(m, p, { body: b });
  log(`${m} ${p}: user ->`, asUser.status, short(asUser.json), '| anon ->', anon.status);
}

log('=== DATA EXPOSURE ===');
const list = await req('GET', '/problem/');
log('GET /problem/ (anon, no paging) ->', list.status, 'count', list.json.allProblems.length, 'limit', list.json.limit, 'leaks markers?', MARKERS.test(list.text), 'cache-control', list.headers.get('cache-control'));
const one = await req('GET', `/problem/${pid}`, { token: tU });
log('GET /problem/:id (user) ->', one.status, 'keys', Object.keys(one.json.problem), 'leaks markers?', MARKERS.test(one.text), 'cache-control', one.headers.get('cache-control'));
log('GET /problem/:id (anon) ->', (await req('GET', `/problem/${pid}`)).status);
const sol = await req('GET', `/problem/${pid}/solution`, { token: tU });
log('GET /problem/:id/solution (user, unsolved) ->', sol.status, short(sol.json));
const solA = await req('GET', `/problem/${pid}/solution`, { token: tA });
log('GET /problem/:id/solution (admin) ->', solA.status, 'has reference marker', MARKERS.test(solA.text));
log('GET /user/profile (user) ->', (await req('GET', '/user/profile', { token: tU })).status, 'leaks?', MARKERS.test((await req('GET', '/user/profile', { token: tU })).text));
const chk = await req('GET', '/user/check', { token: tU });
log('GET /user/check ->', chk.status, short(chk.json));
log('GET /problem/solved ->', short((await req('GET', '/problem/solved', { token: tU })).json));
log('GET /admin/dashboard (admin) ->', short((await req('GET', '/admin/dashboard', { token: tA })).json));

log('=== INPUT VALIDATION / ERROR LEAKS ===');
r = await req('GET', '/problem/?search=a&search=b');
log('GET /problem/?search=a&search=b ->', r.status, short(r.json));
r = await req('GET', '/problem/?difficulty[$ne]=x');
log('GET /problem/?difficulty[$ne]=x ->', r.status, short(r.json));
r = await req('GET', '/problem/?search=' + encodeURIComponent('(a+)+$'));
log('GET /problem/?search=(a+)+$ ->', r.status, 'count', r.json.allProblems?.length, '(escaped)');
r = await req('GET', '/problem/?page=-5&limit=100000');
log('GET /problem/?page=-5&limit=100000 ->', r.status, 'limit', r.json.limit, 'page', r.json.currentPage);
r = await req('GET', '/problem/submissions/not-an-id', { token: tU });
log('GET /problem/submissions/not-an-id ->', r.status, short(r.json));
r = await req('POST', '/submission/submit/not-an-id', { token: tU, body: { code: 'x', language: 'cpp' } });
log('POST /submission/submit/not-an-id ->', r.status, short(r.json));
r = await req('POST', `/submission/submit/${pid}`, { token: tU, body: { code: 'x', language: { toLowerCase: 1 } } });
log('POST submit language as object ->', r.status, short(r.json));
r = await req('GET', '/submission/health');
log('GET /submission/health (anon) ->', r.status, short(r.json));

log('=== HEADERS / CORS ===');
r = await req('GET', '/problem/', { headers: { Origin: 'https://evil.example' } });
log('x-powered-by:', r.headers.get('x-powered-by'), '| ACAO for evil origin:', r.headers.get('access-control-allow-origin'), '| x-frame-options:', r.headers.get('x-frame-options'), '| strict-transport-security:', r.headers.get('strict-transport-security'), '| x-content-type-options:', r.headers.get('x-content-type-options'));
r = await req('GET', '/problem/', { headers: { Origin: 'http://localhost:5174' } });
log('ACAO for allowed origin:', r.headers.get('access-control-allow-origin'), 'credentials:', r.headers.get('access-control-allow-credentials'));
r = await req('GET', '/nonexistent-route');
log('unknown route ->', r.status, r.text.slice(0, 120));

log('=== TOKEN HANDLING ===');
const parts = tU.split('.');
const tampered = parts[0] + '.' + Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(parts[1], 'base64url')), role: 'admin' })).toString('base64url') + '.' + parts[2];
log('tampered token (role:admin) /user/check ->', (await req('GET', '/user/check', { token: tampered })).status);
const noneAlg = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url') + '.' + parts[1] + '.';
log('alg:none token ->', (await req('GET', '/user/check', { token: noneAlg })).status);
const lo = await req('POST', '/user/logout', { token: tO });
log('logout other ->', lo.status, '| reuse after logout ->', (await req('GET', '/user/check', { token: tO })).status, short((await req('GET', '/user/check', { token: tO })).json));

console.log('__TOKENS__' + JSON.stringify({ tA, tU, pid }));
