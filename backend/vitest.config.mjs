import { defineConfig } from 'vitest/config';

// Integration tests run against a real MongoDB (single-node replica set) and Redis: locally disposable
// Docker containers on 127.0.0.1:27018 / :6380 (see README), in CI service containers. Override with TEST_* variables.
const env = process.env;
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globalSetup: ['./tests/helpers/globalSetup.js'],
    fileParallelism: false, // tests share one database
    testTimeout: 20000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: env.TEST_LOG_LEVEL || 'silent',
      MONGO_URI: env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27018/oncode_test?replicaSet=rs0&directConnection=true',
      REDIS_HOST: env.TEST_REDIS_HOST || '127.0.0.1',
      REDIS_PORT: env.TEST_REDIS_PORT || '6380',
      REDIS_PASS: env.TEST_REDIS_PASS ?? 'auditpass',
      JWT_KEY: 'test-only-jwt-key-not-a-secret-0123456789abcdef',
      // In-process mock Judge0 started by globalSetup; never a real Judge0
      JUDGE0_BASE_URL: `http://127.0.0.1:${env.TEST_JUDGE0_PORT || 2459}`,
      JUDGE0_AUTH_TOKEN: 'test',
      JUDGE0_TIMEOUT_MS: '2000',
      JUDGE0_DEADLINE_MS: '6000',
      GEMINI_API_KEY: 'test-dummy-key-never-called',
      CLIENT_URL: 'http://localhost:5173',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      reporter: ['text-summary', 'text', 'json-summary'],
    },
  },
});
