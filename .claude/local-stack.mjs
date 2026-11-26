// Local verification stack, DISPOSABLE services only (see audit/harness/README.md).
//   node .claude/local-stack.mjs backend   -> mock Judge0 on 127.0.0.1:2460 + API on :3100 (audit Mongo/Redis)
//   node .claude/local-stack.mjs frontend  -> Vite on :5174 talking to :3100
// Port 2460 avoids the real local Judge0 (WSL) on 2358. Never touches the Atlas/Redis Cloud values in backend/.env:
// process env vars win over dotenv, and every service variable is set here.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const which = process.argv[2];

const run = (cmd, args, cwd, env) => {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', (code) => process.exit(code ?? 0));
  return child;
};

if (which === 'backend') {
  run('node', [path.join(root, 'audit/harness/mock-judge0.mjs')], root, { MOCK_JUDGE0_PORT: '2460' });
  run('node', ['src/server.js'], path.join(root, 'backend'), {
    PORT: '3100',
    MONGO_URI: 'mongodb://127.0.0.1:27018/oncode_audit?replicaSet=rs0&directConnection=true',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: '6380',
    REDIS_PASS: 'auditpass',
    JWT_KEY: 'local-audit-only-key-not-a-secret-0123456789abcdef',
    JUDGE0_BASE_URL: 'http://127.0.0.1:2460',
    JUDGE0_AUTH_TOKEN: 'local-dummy',
    // Never call the real Gemini from local verification
    GEMINI_API_KEY: 'local-dummy-not-a-key',
    CLIENT_URL: 'http://localhost:5174',
  });
} else if (which === 'frontend') {
  run('npx', ['vite', '--port', '5174', '--strictPort'], path.join(root, 'frontend'), {
    VITE_API_URL: 'http://localhost:3100',
  });
} else {
  console.error('usage: node .claude/local-stack.mjs backend|frontend');
  process.exit(1);
}
