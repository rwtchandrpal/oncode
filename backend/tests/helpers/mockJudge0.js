// Minimal Judge0 stand-in. The verdict comes from a marker in the submitted source:
//   MOCK_WA / MOCK_CE / MOCK_RE (stderr echoes stdin) / MOCK_TLE,
//   MOCK_DOWN (batch create answers 503 = Judge0 unavailable), otherwise Accepted.
//   MOCK_CTLE: "Compilation time limit exceeded" (an overloaded Judge0, not a real compile error).
//   MOCK_SLOW_POLL: Accepted, but the first poll answers after the client's per-request timeout.
import http from 'node:http';
import crypto from 'node:crypto';

const b64 = (s) => Buffer.from(String(s ?? ''), 'utf8').toString('base64');
const unb64 = (s) => Buffer.from(String(s ?? ''), 'base64').toString('utf8');

const verdict = (sub) => {
  const src = unb64(sub.source_code);
  const base = { time: '0.010', memory: 2048, stdout: null, stderr: null, compile_output: null };
  if (src.includes('MOCK_CTLE')) return { ...base, status_id: 6, compile_output: b64('Compilation time limit exceeded.') };
  if (src.includes('MOCK_CE')) return { ...base, status_id: 6, compile_output: b64('main.cpp:1: error: mock compile error') };
  if (src.includes('MOCK_RE')) return { ...base, status_id: 11, stderr: b64(`echo: ${unb64(sub.stdin)}`) };
  if (src.includes('MOCK_TLE')) return { ...base, status_id: 5 };
  if (src.includes('MOCK_WA')) return { ...base, status_id: 4, stdout: b64('wrong') };
  return { ...base, status_id: 3, stdout: sub.expected_output };
};

// Longer than JUDGE0_TIMEOUT_MS in vitest.config.mjs (2000), well inside JUDGE0_DEADLINE_MS (6000)
const SLOW_POLL_MS = 2500;

export const startMockJudge0 = (port) => {
  const store = new Map();
  const slowPolls = new Set();
  const send = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (req.method === 'GET' && url.pathname === '/about') return send(res, 200, { version: 'mock' });
      if (req.method === 'POST' && url.pathname === '/submissions/batch') {
        const { submissions = [] } = JSON.parse(raw || '{}');
        if (submissions.some((s) => unb64(s.source_code).includes('MOCK_DOWN'))) return send(res, 503, { error: 'down' });
        return send(res, 201, submissions.map((s) => {
          const token = crypto.randomUUID();
          store.set(token, verdict(s));
          if (unb64(s.source_code).includes('MOCK_SLOW_POLL')) slowPolls.add(token);
          return { token };
        }));
      }
      if (req.method === 'GET' && url.pathname === '/submissions/batch') {
        const tokens = (url.searchParams.get('tokens') || '').split(',').filter(Boolean);
        const reply = () => send(res, 200, { submissions: tokens.map((t) => ({ token: t, ...(store.get(t) || { status_id: 13 }) })) });
        // MOCK_SLOW_POLL: the first poll for such a batch answers after the client's request timeout
        const slow = tokens.find((t) => slowPolls.has(t));
        if (slow) {
          tokens.forEach((t) => slowPolls.delete(t));
          return setTimeout(reply, SLOW_POLL_MS);
        }
        return reply();
      }
      send(res, 404, { error: 'not found' });
    });
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
};
