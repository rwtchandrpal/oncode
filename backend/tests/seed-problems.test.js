import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connect, disconnect, resetData, seed, api, login, auth, PASSWORDS, Problem } from './helpers/app.js';

const require = createRequire(import.meta.url);
const { createProblemBody } = require('../src/validation/problem.js');
const { slugify } = require('../src/utils/slug.js');

const SEED = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed');
const list = JSON.parse(fs.readFileSync(path.join(SEED, 'blind75-list.json'), 'utf8')).problems;
const verified = JSON.parse(fs.readFileSync(path.join(SEED, 'verified.json'), 'utf8'));
const FIELDS = ['slug', 'title', 'difficulty', 'topics', 'description', 'constraints', 'examples', 'visibleTestCase', 'hiddenTestCases', 'codeSnippets', 'referenceSolutions'];
const fileOf = (slug) => path.join(SEED, 'problems', `${slug}.json`);
const docOf = (slug) => {
  const p = JSON.parse(fs.readFileSync(fileOf(slug), 'utf8'));
  return Object.fromEntries(FIELDS.map((f) => [f, p[f]]));
};

// Offline: the seed files themselves (no database needed for these checks)
describe('seed data (backend/seed)', () => {
  it('has all 75 Blind 75 problems with the expected difficulty split', () => {
    expect(list).toHaveLength(75);
    const count = (d) => list.filter((p) => p.difficulty === d).length;
    expect([count('Easy'), count('Medium'), count('Hard')]).toEqual([19, 49, 7]);
    expect(new Set(list.map((p) => p.slug)).size).toBe(75);
  });

  it.each(list.map((p) => [p.slug]))('%s: verified, valid for the model and for the admin API', async (slug) => {
    const raw = fs.readFileSync(fileOf(slug));
    expect(verified[slug]?.sha256).toBe(crypto.createHash('sha256').update(raw).digest('hex'));
    const doc = docOf(slug);
    await new Problem({ ...doc, problemCreator: new mongoose.Types.ObjectId() }).validate();
    const parsed = createProblemBody.safeParse(doc);
    expect(parsed.success, JSON.stringify(parsed.error?.issues?.slice(0, 2))).toBe(true);
    expect(parsed.data.slug).toBe(slug);
    // So an admin-created problem with the same title gets the same slug
    expect(slugify(doc.title)).toBe(slug);
    expect(doc.hiddenTestCases.length).toBeGreaterThanOrEqual(1);
    expect(doc.hiddenTestCases.length).toBeLessThanOrEqual(10);
    expect(doc.codeSnippets.map((c) => c.language).sort()).toEqual(['cpp', 'java']);
  });
});

// Admin API with the seed format (database + mock Judge0, which accepts the reference solutions)
describe('admin problem API with the seed format', () => {
  let adminToken;
  beforeAll(async () => {
    await connect();
    await resetData();
    await seed();
    adminToken = await login('admin@test.local', PASSWORDS.admin);
  });
  afterAll(disconnect);

  const create = (body) => api().post('/problem').set(auth(adminToken)).send(body);

  it('creates a problem from a seed file, keeping its slug, and hides tests from users', async () => {
    const res = await create(docOf('two-sum'));
    expect(res.status).toBe(201);
    expect(res.body.problem.slug).toBe('two-sum');
    const pub = await api().get(`/problem/${res.body.problem._id}`).set(auth(adminToken));
    expect(pub.status).toBe(200);
    expect(pub.body.problem.slug).toBe('two-sum');
    expect(pub.body.problem).not.toHaveProperty('hiddenTestCases');
    expect(pub.body.problem).not.toHaveProperty('referenceSolutions');
    expect(pub.body.problem.codeSnippets.every((c) => !('driverCode' in c))).toBe(true);
  });

  it('accepts a test case of 200 KB and rejects one above it', async () => {
    const doc = docOf('valid-anagram');
    const big = 'a'.repeat(200 * 1024);
    const ok = await create({ ...doc, hiddenTestCases: [{ input: big, expectedOutput: 'true' }, ...doc.hiddenTestCases.slice(1)] });
    expect(ok.status).toBe(201);
    const tooBig = await create({ ...docOf('contains-duplicate'), hiddenTestCases: [{ input: big + 'a', expectedOutput: 'true' }] });
    expect(tooBig.status).toBe(400);
  });

  it('rejects a duplicate slug with a slug-specific message', async () => {
    const res = await create({ ...docOf('missing-number'), slug: 'two-sum' });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/slug already exists/);
  });

  it('a rejected duplicate title does not use up a problem number', async () => {
    const before = await Problem.findOne({}).sort('-number').select('number').lean();
    const dup = await create({ ...docOf('house-robber'), title: 'Two Sum', slug: 'two-sum-again' });
    expect(dup.status).toBe(400);
    expect(JSON.stringify(dup.body)).toMatch(/title already exists/);
    const next = await create(docOf('house-robber'));
    expect(next.status).toBe(201);
    expect(next.body.problem.number).toBe(before.number + 1);
  });

  it('rejects a malformed slug and normalises case', async () => {
    const bad = await create({ ...docOf('climbing-stairs'), slug: 'Climbing Stairs!' });
    expect(bad.status).toBe(400);
    const upper = await create({ ...docOf('climbing-stairs'), slug: 'Climbing-Stairs' });
    expect(upper.status).toBe(201);
    expect(upper.body.problem.slug).toBe('climbing-stairs');
  });

  it('a compile starved by an overloaded Judge0 is "unavailable" (503), not a compile error', async () => {
    const two = await Problem.findOne({ slug: 'two-sum' }).lean();
    const res = await api().post(`/submission/submit/${two._id}`).set(auth(adminToken)).send({ code: '// MOCK_CTLE', language: 'cpp' });
    expect(res.status).toBe(503);
    expect(JSON.stringify(res.body)).not.toMatch(/Compilation/);
  });

  it('a poll that times out is retried within the deadline instead of failing the submission', async () => {
    const two = await Problem.findOne({ slug: 'two-sum' }).lean();
    const res = await api().post(`/submission/submit/${two._id}`).set(auth(adminToken)).send({ code: '// MOCK_SLOW_POLL', language: 'cpp' });
    expect(res.status).toBe(201);
    expect(res.body.submissionResult.status).toBe('Accepted');
  }, 15000);

  it('generates the slug from the title when it is empty, and keeps it on update', async () => {
    const res = await create({ ...docOf('counting-bits'), slug: '' });
    expect(res.status).toBe(201);
    const id = res.body.problem._id;
    expect(res.body.problem.slug).toBe('counting-bits');

    const retitled = await api().put(`/problem/${id}`).set(auth(adminToken)).send({ title: 'Counting Bits Again', slug: '' });
    expect(retitled.status).toBe(200);
    expect((await Problem.findById(id).lean()).slug).toBe('counting-bits');
    const set = await api().put(`/problem/${id}`).set(auth(adminToken)).send({ slug: 'bits-counting' });
    expect(set.status).toBe(200);
    expect((await Problem.findById(id).lean()).slug).toBe('bits-counting');
  });

  it('rejects a reserved slug', async () => {
    const res = await create({ ...docOf('house-robber'), slug: 'solved' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
