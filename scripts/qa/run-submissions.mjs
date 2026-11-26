// Runs solutions through the REAL submission pipeline (POST /submission/submit/:id -> local Judge0) and
// writes a result table. LOCAL QA stack only (scripts/qa/stack.mjs backend, API on :3200).
//
//   node scripts/qa/run-submissions.mjs                 all 75 problems, correct C++ and Java reference
//                                                       + wrong / infinite loop / runtime error / compile
//                                                       error on a sample of problems
//   node scripts/qa/run-submissions.mjs two-sum 3sum    only these slugs
//   QA_API=http://localhost:3200 QA_SAMPLE_EVERY=7 ...  overrides
//
// The per-IP submit rate limit (50 / 15 min) would stop a 150+ submission run, so the script deletes the
// rl:submit:* keys in the LOCAL QA Redis before each request. That is a harness step, not app behaviour.
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const require = createRequire(import.meta.url);
const { createClient } = require(path.join(root, 'backend', 'node_modules', 'redis'));
const { ACCOUNTS } = require('./fixtures.js');
// Same local QA Redis as scripts/qa/stack.mjs
const QA = { REDIS_HOST: '127.0.0.1', REDIS_PORT: '6380', REDIS_PASS: 'qapass' };

const API = process.env.QA_API || 'http://localhost:3200';
const SAMPLE_EVERY = Number(process.env.QA_SAMPLE_EVERY || 7);
const only = process.argv.slice(2);
const REF = path.join(root, 'backend', 'seed', 'reference');

const redis = createClient({ socket: { host: QA.REDIS_HOST, port: Number(QA.REDIS_PORT) }, password: QA.REDIS_PASS });
await redis.connect();
const resetSubmitLimit = async () => {
  for await (const keys of redis.scanIterator({ MATCH: 'rl:submit:*', COUNT: 100 })) {
    const list = Array.isArray(keys) ? keys : [keys];
    if (list.length) await redis.del(list);
  }
};

let token = null;
const login = async () => {
  const r = await fetch(`${API}/user/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: ACCOUNTS.user.email, password: ACCOUNTS.user.password }) });
  if (!r.ok) throw new Error(`login failed ${r.status}`);
  token = (await r.json()).token;
};

const api = async (method, url, body) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(`${API}${url}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401 && attempt === 0) { await login(); continue; }
    return { status: r.status, data: await r.json().catch(() => ({})) };
  }
};

const submit = async (problemId, language, code) => {
  await resetSubmitLimit();
  const t0 = Date.now();
  let res = await api('POST', `/submission/submit/${problemId}`, { language, code });
  // One retry on 503 (local Judge0 overloaded); reported in the table either way
  let retried = false;
  if (res.status === 503) { retried = true; await new Promise((r) => setTimeout(r, 3000)); await resetSubmitLimit(); res = await api('POST', `/submission/submit/${problemId}`, { language, code }); }
  const s = res.data.submissionResult;
  return { http: res.status, status: s?.status || res.data?.error?.message || res.data?.message, passed: s?.testCasesPassed, total: s?.testCasesTotal, ms: Date.now() - t0, retried, errorMessage: s?.errorMessage };
};

// Infinite loop / runtime error injected at static-initialisation time, so they work for every problem
const INJECT = {
  tle: {
    cpp: (code) => `${code}\nstatic int qa_spin = [](){ volatile unsigned long long x = 1; while (x) { x = x * 3 + 1; if (x == 0) x = 1; } return 0; }();\n`,
    java: (code) => code.replace(/class Solution\s*\{/, (m) => `${m}\n    static { long qaX = 1; while (qaX != 0) { qaX = qaX * 3 + 1; if (qaX == 0) qaX = 1; } }\n`),
  },
  rte: {
    cpp: (code) => `${code}\nstatic int qa_crash = [](){ volatile int* p = nullptr; *p = 1; return 0; }();\n`,
    java: (code) => code.replace(/class Solution\s*\{/, (m) => `${m}\n    static { int[] qaA = new int[1]; int qaI = 2; qaA[qaI] = 1; }\n`),
  },
  ce: { cpp: () => 'this is not C++ ;', java: () => 'class Solution { this is not java }' },
};

const listAll = async () => {
  const r = await fetch(`${API}/problem?limit=100`);
  return (await r.json()).allProblems;
};

await login();
const problems = (await listAll()).filter((p) => !only.length || only.includes(p.slug));
const rows = [];
let i = 0;
for (const p of problems) {
  i++;
  const dir = path.join(REF, p.slug);
  const ref = { cpp: readFileSync(path.join(dir, 'solution.cpp'), 'utf8'), java: readFileSync(path.join(dir, 'solution.java'), 'utf8') };
  const checks = [];
  for (const lang of ['cpp', 'java']) {
    const r = await submit(p._id, lang, ref[lang]);
    checks.push({ kind: `correct ${lang}`, expect: 'Accepted', ...r, ok: r.status === 'Accepted' && r.passed === r.total && r.total > 0 && r.total <= 10 });
  }
  if (i % SAMPLE_EVERY === 1 || only.length) {
    const wrongFile = existsSync(dir) && readdirSync(dir).find((f) => /^wrong.*\.(cpp|java)$/.test(f));
    if (wrongFile) {
      const lang = wrongFile.endsWith('.java') ? 'java' : 'cpp';
      const r = await submit(p._id, lang, readFileSync(path.join(dir, wrongFile), 'utf8'));
      checks.push({ kind: `wrong ${lang} (${wrongFile})`, expect: 'Wrong Answer', ...r, ok: r.status === 'Wrong Answer' });
    }
    const lang = i % 2 ? 'cpp' : 'java';
    for (const [kind, expect, match] of [['tle', 'Time Limit Exceeded', (s) => s === 'Time Limit Exceeded'], ['rte', 'Runtime Error', (s) => /^Runtime Error/.test(s || '')], ['ce', 'Compilation Error', (s) => s === 'Compilation Error']]) {
      const r = await submit(p._id, lang, INJECT[kind][lang](ref[lang]));
      checks.push({ kind: `${kind} ${lang}`, expect, ...r, ok: match(r.status) });
    }
  }
  const bad = checks.filter((c) => !c.ok);
  rows.push({ n: p.number, slug: p.slug, checks });
  console.log(`${String(p.number).padStart(2)} ${p.slug.padEnd(55)} ${bad.length ? 'FAIL ' + bad.map((c) => `${c.kind}: ${c.status}`).join('; ') : 'ok'}  ${checks.map((c) => `${c.kind}=${c.status}${c.retried ? '(retry)' : ''} ${c.ms}ms`).join(' | ')}`);
}

const outDir = path.join(here, 'results');
mkdirSync(outDir, { recursive: true });
const md = ['| # | problem | C++ correct | Java correct | sampled checks | result | issue |', '|---|---|---|---|---|---|---|'];
for (const r of rows) {
  const c = (k) => r.checks.find((x) => x.kind === k);
  const fmt = (x) => (x ? `${x.status} ${x.passed ?? ''}/${x.total ?? ''} (${x.ms} ms${x.retried ? ', retried' : ''})` : '');
  const extra = r.checks.filter((x) => !x.kind.startsWith('correct')).map((x) => `${x.kind}: ${x.status}`).join('<br>');
  const bad = r.checks.filter((x) => !x.ok);
  md.push(`| ${r.n} | ${r.slug} | ${fmt(c('correct cpp'))} | ${fmt(c('correct java'))} | ${extra} | ${bad.length ? 'FAIL' : 'PASS'} | ${bad.map((x) => `${x.kind}: expected ${x.expect}, got ${x.status}`).join('; ')} |`);
}
const total = rows.length, failed = rows.filter((r) => r.checks.some((x) => !x.ok)).length;
md.push('', `${total} problems, ${total - failed} PASS, ${failed} FAIL. Generated ${new Date().toISOString()}.`);
const name = only.length ? 'submissions-partial.md' : 'submissions.md';
writeFileSync(path.join(outDir, name), md.join('\n') + '\n');
writeFileSync(path.join(outDir, name.replace('.md', '.json')), JSON.stringify(rows, null, 1));
console.log(`\n${total} problems, ${total - failed} PASS, ${failed} FAIL -> scripts/qa/results/${name}`);
await redis.quit();
