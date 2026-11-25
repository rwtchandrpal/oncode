// Loads the CommonJS app with Node's own require (one module instance shared by app and tests),
// connects to the test MongoDB/Redis, and creates fixtures with marker strings for leak checks.
import { createRequire } from 'node:module';
import request from 'supertest';

const require = createRequire(import.meta.url);

export const app = require('../../src/app.js');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
export const redis = require('../../src/config/redis.js');
require('../../src/config/db.js'); // applies mongoose sanitizeFilter, as in production
export const User = require('../../src/models/user.js');
export const Problem = require('../../src/models/problem.js');
export const Submission = require('../../src/models/submission.js');

export const MARKERS = /HIDDEN_INPUT_MARKER|HIDDEN_OUTPUT_MARKER|DRIVER_SECRET_MARKER|REFERENCE_SECRET_MARKER|\$2[aby]\$/;

// Safety: tests wipe their database. Only local hosts (or CI service containers) and a *test* DB.
const assertSafeTarget = () => {
  const uri = new URL(process.env.MONGO_URI);
  const local = ['127.0.0.1', 'localhost'].includes(uri.hostname);
  if ((!local && !process.env.CI) || !/test/i.test(uri.pathname)) {
    throw new Error(`Refusing to run tests against ${uri.hostname}${uri.pathname}`);
  }
};

export const connect = async () => {
  assertSafeTarget();
  if (mongoose.connection.readyState !== 1) await mongoose.connect(process.env.MONGO_URI);
  if (!redis.isOpen) await redis.connect();
};

export const disconnect = async () => {
  if (redis.isOpen) await redis.close();
  await mongoose.disconnect();
};

export const resetData = async () => {
  await Promise.all([
    User.deleteMany({}),
    Problem.deleteMany({}),
    Submission.deleteMany({}),
    mongoose.connection.db.collection('counters').deleteMany({}),
  ]);
  await redis.flushDb();
};

export const PASSWORDS = { admin: 'TestAdmin#2026', user: 'TestUser#2026', other: 'TestOther#2026' };

export const seed = async () => {
  const make = async (role, email, password) =>
    User.create({ firstName: 'Test', lastName: role, email, role: role === 'admin' ? 'admin' : 'user', password: await bcrypt.hash(password, 4) });
  const admin = await make('admin', 'admin@test.local', PASSWORDS.admin);
  const user = await make('user', 'user@test.local', PASSWORDS.user);
  const other = await make('other', 'other@test.local', PASSWORDS.other);

  const problem = await Problem.create({
    title: 'Double It',
    topics: ['Math'],
    description: 'Return n * 2.',
    difficulty: 'Easy',
    constraints: ['1 <= n'],
    codeSnippets: [
      { language: 'cpp', userSnippet: 'class Solution {};', driverCode: '// DRIVER_SECRET_MARKER\n{{USER_CODE}}' },
      { language: 'java', userSnippet: 'class Solution {}', driverCode: '// DRIVER_SECRET_MARKER java\n{{USER_CODE}}' },
    ],
    referenceSolutions: [{ language: 'cpp', code: '// REFERENCE_SECRET_MARKER' }],
    visibleTestCase: { input: '3', expectedOutput: '6' },
    hiddenTestCases: [
      { input: '41 HIDDEN_INPUT_MARKER', expectedOutput: '82 HIDDEN_OUTPUT_MARKER' },
      { input: '5', expectedOutput: '10' },
    ],
    examples: [{ input: 'n = 3', output: '6' }],
    problemCreator: admin._id,
  });
  return { admin, user, other, problem };
};

export const api = () => request(app);

export const login = async (email, password) => {
  const res = await api().post('/user/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
  return res.body.token;
};

export const auth = (token) => ({ Authorization: `Bearer ${token}` });
