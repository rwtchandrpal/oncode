// Phase 3 API tests, batch 2: Judge0-offline behaviour, data integrity, demo sessions, payload size.
// LOCAL ONLY. Usage: node api-tests-2.mjs '<json with tA,tU,pid>'
import { execSync } from 'node:child_process';
const B = 'http://localhost:3100';
const { tA, tU, pid } = JSON.parse(process.argv[2]);
const log = (...a) => console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
const req = async (method, path, { token, body } = {}) => {
  const t0 = performance.now();
  const r = await fetch(B + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await r.text(); let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: r.status, ms: Math.round(performance.now() - t0), json, headers: r.headers };
};
const short = (j) => JSON.stringify(j).slice(0, 200);
const mongo = (js) => execSync(`docker exec oncode-audit-mongo mongosh --quiet oncode_audit --eval ${JSON.stringify(js)}`).toString().trim();

log('=== RUN / SUBMIT WITH JUDGE0 OFFLINE ===');
log('submissions in DB before:', mongo('db.submissions.countDocuments()'));
let r = await req('POST', `/submission/run/${pid}`, { token: tU, body: { code: 'class Solution{};', language: 'cpp' } });
log('RUN ->', r.status, `${r.ms}ms`, short(r.json));
r = await req('POST', `/submission/submit/${pid}`, { token: tU, body: { code: 'class Solution{};', language: 'cpp' } });
log('SUBMIT ->', r.status, `${r.ms}ms`, short(r.json));
log('submissions in DB after one failed submit:', mongo('db.submissions.countDocuments()'), '| statuses:', mongo('JSON.stringify(db.submissions.find({}, {status:1,testCasesPassed:1,testCasesTotal:1,_id:0}).toArray())'));
r = await req('GET', `/problem/submissions/${pid}`, { token: tU });
log('user sees in history:', short(r.json.submissions?.map((s) => ({ status: s.status, passed: s.testCasesPassed, total: s.testCasesTotal }))));
r = await req('GET', '/user/profile', { token: tU });
log('profile stats after failed submit:', short({ total: r.json.stats.totalSubmissions, accepted: r.json.stats.acceptedSubmissions, rate: r.json.stats.acceptanceRate }));
r = await req('POST', `/submission/submit/${pid}`, { token: tU, body: { code: 'x', language: 'python' } });
log('SUBMIT unsupported language ->', r.status, short(r.json));

log('=== PAYLOAD SIZE (code stored before Judge0 call) ===');
const big = '//' + 'A'.repeat(4_500_000);
r = await req('POST', `/submission/submit/${pid}`, { token: tU, body: { code: big, language: 'cpp' } });
log('SUBMIT 4.5MB code ->', r.status, `${r.ms}ms`, short(r.json));
log('largest stored submission code length (bytes):', mongo('db.submissions.aggregate([{$project:{l:{$strLenBytes:"$code"}}},{$sort:{l:-1}},{$limit:1}]).toArray()[0].l'));
r = await req('POST', `/submission/submit/${pid}`, { token: tU, body: { code: 'B'.repeat(6_000_000), language: 'cpp' } });
log('SUBMIT 6MB code ->', r.status, short(r.json));

log('=== DEMO SESSIONS ===');
const demo = await req('POST', '/user/demo');
log('POST /user/demo ->', demo.status, short(demo.json.user), 'token exp hours =', ((JSON.parse(Buffer.from(demo.json.token.split('.')[1], 'base64url')).exp - Date.now() / 1000) / 3600).toFixed(1));
const tD = demo.json.token;
let last;
for (let i = 1; i <= 21; i++) last = await req('POST', `/submission/run/${pid}`, { token: tD, body: { code: 'x', language: 'cpp' } });
log('demo user 21st run ->', last.status, short(last.json), '| redis counter:', execSync('docker exec oncode-audit-redis redis-cli -a auditpass --no-auth-warning KEYS "demo_runs:*"').toString().trim().split('\n').length, 'key(s)');
r = await req('POST', '/chatAI/doubt', { token: tD, body: {} });
log('demo user can reach AI tutor route ->', r.status, short(r.json));
r = await req('DELETE', '/user/profile', { token: tD });
log('demo delete profile ->', r.status, short(r.json));

log('=== DELETE ACCOUNT: token reuse ===');
const reg = await req('POST', '/user/register', { body: { firstName: 'Del', lastName: 'Me', email: 'delme@audit.test', password: 'DelMe#12345' } });
const tDel = reg.json.token;
r = await req('DELETE', '/user/profile', { token: tDel });
log('delete profile ->', r.status, short(r.json));
r = await req('POST', '/user/logout', { token: tDel });
log('logout right after delete (what the frontend does) ->', r.status, short(r.json));

console.log('__DEMO__' + JSON.stringify({ tD }));
