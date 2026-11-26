// Pre-release QA stack. DISPOSABLE local services only; never the Atlas / Redis Cloud values in backend/.env
// (process env vars win over dotenv, and every service variable is set here).
//
//   node scripts/qa/stack.mjs backend          API on :3200 -> Mongo 127.0.0.1:27018/oncode_test, Redis :6380,
//                                              the real LOCAL Judge0 (JUDGE0_BASE_URL/AUTH_TOKEN from backend/.env,
//                                              refused unless it is localhost) and the real Gemini key (AI tutor).
//   node scripts/qa/stack.mjs backend-nojudge  API on :3201, same DB, Judge0 pointed at a closed port (outage tests)
//   node scripts/qa/stack.mjs frontend         Vite on :5175 talking to :3200
//
// Containers (WSL docker):
//   docker run -d --name oncode-qa-mongo -p 27018:27017 mongo:7 --replSet rs0 --bind_ip_all
//   docker exec oncode-qa-mongo mongosh --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27017"}]})'
//   docker run -d --name oncode-qa-redis -p 6380:6379 redis:7-alpine redis-server --requirepass qapass
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const which = process.argv[2];

export const QA = {
  MONGO_URI: 'mongodb://127.0.0.1:27018/oncode_test?replicaSet=rs0&directConnection=true',
  REDIS_HOST: '127.0.0.1',
  REDIS_PORT: '6380',
  REDIS_PASS: 'qapass',
  JWT_KEY: 'local-qa-only-key-not-a-secret-0123456789abcdef0123',
};

const readDotEnv = (name) => {
  const text = readFileSync(path.join(root, 'backend', '.env'), 'utf8');
  const m = text.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined;
};

const run = (cmd, args, cwd, env) => {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', (code) => process.exit(code ?? 0));
  return child;
};

const backend = (port, judge0Url) => {
  const host = new URL(judge0Url).hostname;
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    console.error('Refusing to start: JUDGE0_BASE_URL is not a local Judge0.');
    process.exit(1);
  }
  run('node', ['src/server.js'], path.join(root, 'backend'), {
    ...QA,
    PORT: String(port),
    JUDGE0_BASE_URL: judge0Url,
    CLIENT_URL: 'http://localhost:5175',
  });
};

if (which === 'backend') backend(3200, readDotEnv('JUDGE0_BASE_URL') || 'http://localhost:2358');
else if (which === 'backend-nojudge') backend(3201, 'http://127.0.0.1:2359');
else if (which === 'frontend') {
  run('npx', ['vite', '--port', '5175', '--strictPort'], path.join(root, 'frontend'), { VITE_API_URL: 'http://localhost:3200' });
} else {
  console.error('usage: node scripts/qa/stack.mjs backend|backend-nojudge|frontend');
  process.exit(1);
}
