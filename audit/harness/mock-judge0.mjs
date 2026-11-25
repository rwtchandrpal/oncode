// Minimal local Judge0 stand-in for verifying the submission pipeline while the real Judge0 is off.
// Never used in production. Listens on 127.0.0.1:${MOCK_JUDGE0_PORT:-2358}.
//
// The verdict is picked from a marker in the submitted source code:
//   MOCK_WA  -> 4 Wrong Answer (stdout "wrong")
//   MOCK_CE  -> 6 Compilation Error (compile_output "mock compile error")
//   MOCK_RE  -> 11 Runtime Error (NZEC), stderr echoes the stdin (simulates a hidden-input leak attempt)
//   MOCK_TLE -> 5 Time Limit Exceeded
//   MOCK_DOWN_ON_POLL -> batch create succeeds, polling returns 500
//   MOCK_PROCESSING -> stays at status 2 (Processing) forever, to exercise the backend deadline
//   otherwise -> 3 Accepted, stdout = expected_output
//
// Usage: node audit/harness/mock-judge0.mjs   then start the backend with
//   JUDGE0_BASE_URL=http://127.0.0.1:2358 bash audit/harness/start-backend.sh
import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.MOCK_JUDGE0_PORT || 2358);
const store = new Map();
const b64 = (s) => Buffer.from(String(s ?? ''), 'utf8').toString('base64');
const unb64 = (s) => Buffer.from(String(s ?? ''), 'base64').toString('utf8');

const verdict = (sub) => {
  const src = unb64(sub.source_code);
  const stdin = unb64(sub.stdin);
  const expected = unb64(sub.expected_output);
  const base = { time: '0.012', memory: 3456, stdout: null, stderr: null, compile_output: null };
  if (src.includes('MOCK_PROCESSING')) return { ...base, status_id: 2 };
  if (src.includes('MOCK_CE')) return { ...base, status_id: 6, compile_output: b64('main.cpp:1: error: mock compile error') };
  if (src.includes('MOCK_RE')) return { ...base, status_id: 11, stderr: b64(`echo: ${stdin}`) };
  if (src.includes('MOCK_TLE')) return { ...base, status_id: 5 };
  if (src.includes('MOCK_WA')) return { ...base, status_id: 4, stdout: b64('wrong') };
  return { ...base, status_id: 3, stdout: b64(expected) };
};

const send = (res, code, body) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    if (req.method === 'GET' && url.pathname === '/about') return send(res, 200, { version: 'mock' });
    if (req.method === 'POST' && url.pathname === '/submissions/batch') {
      const { submissions = [] } = JSON.parse(raw || '{}');
      const out = submissions.map((s) => {
        const token = crypto.randomUUID();
        store.set(token, { result: verdict(s), downOnPoll: unb64(s.source_code).includes('MOCK_DOWN_ON_POLL') });
        return { token };
      });
      return send(res, 201, out);
    }
    if (req.method === 'GET' && url.pathname === '/submissions/batch') {
      const tokens = (url.searchParams.get('tokens') || '').split(',').filter(Boolean);
      const entries = tokens.map((t) => store.get(t));
      if (entries.some((e) => e?.downOnPoll)) return send(res, 500, { error: 'mock outage' });
      return send(res, 200, { submissions: entries.map((e, i) => ({ token: tokens[i], ...(e?.result || { status_id: 13 }) })) });
    }
    send(res, 404, { error: 'not found' });
  });
}).listen(PORT, '127.0.0.1', () => console.log(`mock judge0 on 127.0.0.1:${PORT}`));
