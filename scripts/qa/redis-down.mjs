// Behaviour while Redis is down, then recovery. LOCAL QA stack only: stops and restarts the disposable
// oncode-qa-redis container (WSL docker). Run while nothing else uses the stack.
//   node scripts/qa/redis-down.mjs
import { execSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { ACCOUNTS } = require('./fixtures.js');
const API = process.env.QA_API || 'http://localhost:3200';
const docker = (cmd) => execSync(`wsl.exe -d Ubuntu -- docker ${cmd} oncode-qa-redis`, { stdio: 'pipe' });
const call = async (method, url, { token, body } = {}) => {
  const t0 = Date.now();
  const r = await fetch(API + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  return `${r.status} ${d?.error?.code || ''} ${Date.now() - t0}ms`;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const token = JSON.parse(await (await fetch(`${API}/user/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ACCOUNTS.user.email, password: ACCOUNTS.user.password }) })).text()).token;
const guest = JSON.parse(await (await fetch(`${API}/user/guest`, { method: 'POST' })).text()).token;
const list = await (await fetch(`${API}/problem?limit=1`)).json();
const pid = list.allProblems[0]._id;

docker('stop');
await sleep(1500);
console.log('--- Redis stopped');
const rows = [
  ['GET /readyz (expect 503)', () => call('GET', '/readyz')],
  ['GET /problem (topics cache falls back to Mongo)', () => call('GET', '/problem')],
  ['POST /user/login (limiter fails open)', () => call('POST', '/user/login', { body: { email: ACCOUNTS.user.email, password: ACCOUNTS.user.password } })],
  ['GET /user/check (blocklist fails open)', () => call('GET', '/user/check', { token })],
  ['POST /user/guest (fails closed: 503)', () => call('POST', '/user/guest')],
  ['guest POST /submission/run (fails closed: 503)', () => call('POST', `/submission/run/${pid}`, { token: guest, body: { language: 'cpp', code: 'int x;' } })],
  ['guest POST /chatAI/doubt (fails closed: 503)', () => call('POST', '/chatAI/doubt', { token: guest, body: { problemId: pid, userQuestion: 'x', userCode: 'x' } })],
  ['user POST /submission/run (limiter fails open)', () => call('POST', `/submission/run/${pid}`, { token, body: { language: 'python', code: 'x' } })],
  ['POST /user/logout (cannot revoke)', () => call('POST', '/user/logout', { token })],
];
for (const [label, fn] of rows) console.log(label.padEnd(50), await fn());

docker('start');
console.log('--- Redis started');
for (let i = 0; i < 30; i++) {
  await sleep(1000);
  const r = await call('GET', '/readyz');
  if (r.startsWith('200')) { console.log(`GET /readyz recovered after ~${i + 1}s:`, r); break; }
}
console.log('POST /user/guest after recovery'.padEnd(50), await call('POST', '/user/guest'));
console.log('POST /user/logout after recovery'.padEnd(50), await call('POST', '/user/logout', { token }));
console.log('GET /user/check with logged-out token'.padEnd(50), await call('GET', '/user/check', { token }));
