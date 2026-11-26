// How many concurrent submissions the configured Judge0 handles within JUDGE0_DEADLINE_MS (default 30 s).
// LOCAL QA stack only (API on :3200). Run it while nothing else uses Judge0.
//   node scripts/qa/judge-capacity.mjs [slug]       default slug: two-sum
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const require = createRequire(import.meta.url);
const { createClient } = require(path.join(root, 'backend', 'node_modules', 'redis'));
const { ACCOUNTS } = require('./fixtures.js');
const API = process.env.QA_API || 'http://localhost:3200';
const slug = process.argv[2] || 'two-sum';
const redis = createClient({ socket: { host: '127.0.0.1', port: 6380 }, password: 'qapass' });
await redis.connect();

const post = async (url, body, token) => {
  const r = await fetch(API + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};
const token = (await post('/user/login', { email: ACCOUNTS.user.email, password: ACCOUNTS.user.password })).data.token;
const problem = (await (await fetch(`${API}/problem?search=${encodeURIComponent(slug.replace(/-/g, ' '))}`)).json()).allProblems.find((p) => p.slug === slug);
const ref = readFileSync(path.join(root, 'backend', 'seed', 'reference', slug, 'solution.cpp'), 'utf8');
const loop = `${ref}\nstatic int qa_spin = [](){ volatile unsigned long long x = 1; while (x) { x = x * 3 + 1; if (x == 0) x = 1; } return 0; }();\n`;

const submit = async (code) => {
  const t0 = Date.now();
  const r = await post(`/submission/submit/${problem._id}`, { language: 'cpp', code }, token);
  return { ms: Date.now() - t0, verdict: r.data.submissionResult?.status || `${r.status} ${r.data?.error?.code || ''}` };
};
const round = async (label, codes) => {
  for await (const k of redis.scanIterator({ MATCH: 'rl:submit:*' })) if ((Array.isArray(k) ? k : [k]).length) await redis.del(k);
  const t0 = Date.now();
  const res = await Promise.all(codes.map(submit));
  console.log(`${label.padEnd(34)} wall ${String(Date.now() - t0).padStart(6)} ms | ${res.map((r) => `${r.verdict} ${r.ms}ms`).join(' | ')}`);
};

console.log(`problem ${slug}, ${problem ? 'found' : 'NOT FOUND'}`);
await round('1 correct', [ref]);
await round('1 infinite loop (TLE on 10 tests)', [loop]);
await round('2 concurrent correct', [ref, ref]);
await round('3 concurrent correct', [ref, ref, ref]);
await round('1 correct + 1 infinite loop', [ref, loop]);
await redis.quit();
