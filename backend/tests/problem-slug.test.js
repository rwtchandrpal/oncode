import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connect, disconnect, resetData, seed, api, login, auth, PASSWORDS, Problem } from './helpers/app.js';

const require = createRequire(import.meta.url);
const { slugify } = require('../src/utils/slug.js');

const BACKEND = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('slugify', () => {
  it.each([
    ['Two Sum', 'two-sum'],
    ['3Sum', '3sum'],
    ['  Hello,  World!! ', 'hello-world'],
    ['Implement Trie (Prefix Tree)', 'implement-trie-prefix-tree'],
    ['---', 'problem'],
  ])('%j -> %s', (title, slug) => expect(slugify(title)).toBe(slug));
});

describe('problem slugs', () => {
  let fx, userToken, adminToken;
  beforeAll(async () => {
    await connect();
    await resetData();
    fx = await seed();
    userToken = await login('user@test.local', PASSWORDS.user);
    adminToken = await login('admin@test.local', PASSWORDS.admin);
  });
  afterAll(disconnect);

  // The fixture's content without its identity (_id, slug, number, timestamps)
  const base = () => {
    const { title, topics, description, difficulty, constraints, visibleTestCase, hiddenTestCases, examples, referenceSolutions, problemCreator } = fx.problem.toObject();
    const codeSnippets = fx.problem.codeSnippets.map(({ language, userSnippet, driverCode }) => ({ language, userSnippet, driverCode }));
    return { title, topics, description, difficulty, constraints, visibleTestCase, hiddenTestCases, examples, referenceSolutions, problemCreator, codeSnippets };
  };

  it('generates a slug on create, suffixes collisions, and never regenerates on title edits', async () => {
    expect(fx.problem.slug).toBe('double-it');
    const twin = await Problem.create({ ...base(), title: 'Double  it!' });
    expect(twin.slug).toBe('double-it-2');
    const third = await Problem.create({ ...base(), title: 'double it?' });
    expect(third.slug).toBe('double-it-3');

    twin.title = 'Triple It';
    await twin.save();
    expect((await Problem.findById(twin._id).lean()).slug).toBe('double-it-2');
    for (const p of [twin, third]) await Problem.deleteOne({ _id: p._id });
  });

  it('never generates a reserved or ObjectId-like slug', async () => {
    const solved = await Problem.create({ ...base(), title: 'Solved' });
    expect(solved.slug).toBe('solved-2');
    const hex = await Problem.create({ ...base(), title: 'abcdefabcdefabcdefabcdef' });
    expect(hex.slug).toBe('abcdefabcdefabcdefabcdef-2');
    for (const p of [solved, hex]) await Problem.deleteOne({ _id: p._id });
  });

  it('GET /problem/:slug and GET /problem/:id return the same problem, with its slug', async () => {
    const bySlug = await api().get('/problem/double-it').set(auth(userToken));
    expect(bySlug.status).toBe(200);
    expect(bySlug.body.problem._id).toBe(String(fx.problem._id));
    expect(bySlug.body.problem.slug).toBe('double-it');
    expect(bySlug.body.problem).not.toHaveProperty('hiddenTestCases');

    const byId = await api().get(`/problem/${fx.problem._id}`).set(auth(userToken));
    expect(byId.status).toBe(200);
    expect(byId.body.problem.slug).toBe('double-it');

    const upper = await api().get('/problem/Double-It').set(auth(userToken));
    expect(upper.status).toBe(200);
    expect(upper.body.problem._id).toBe(String(fx.problem._id));
  });

  it('answers 404 { error: { code, message } } for an unknown slug or id, 400 for a malformed key', async () => {
    for (const key of ['no-such-problem', new mongoose.Types.ObjectId().toString()]) {
      const res = await api().get(`/problem/${key}`).set(auth(userToken));
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Problem not found.' } });
    }
    const bad = await api().get('/problem/not%20a%20slug!').set(auth(userToken));
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('still requires a user or guest token', async () => {
    expect((await api().get('/problem/double-it')).status).toBe(401);
  });

  it('the list and solved endpoints return the slug of every problem; /problem/solved is not a slug', async () => {
    const list = await api().get('/problem').set(auth(userToken));
    expect(list.status).toBe(200);
    expect(list.body.allProblems.length).toBeGreaterThan(0);
    for (const p of list.body.allProblems) expect(p.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

    const solved = await api().get('/problem/solved').set(auth(userToken));
    expect(solved.status).toBe(200);
    expect(solved.body).toHaveProperty('solvedProblems');
  });

  it('run and submit keep taking the _id, not the slug', async () => {
    const run = await api().post(`/submission/run/${fx.problem._id}`).set(auth(userToken)).send({ code: '// ok', language: 'cpp' });
    expect(run.status).toBe(200);
    const bySlug = await api().post('/submission/run/double-it').set(auth(userToken)).send({ code: '// ok', language: 'cpp' });
    expect(bySlug.status).toBe(400);
  });

  it('an admin metadata edit gives a slug-less (pre-migration) problem a slug', async () => {
    const { insertedId } = await mongoose.connection.db.collection('problems').insertOne({ ...base(), title: 'Legacy Problem', number: 900 });
    const res = await api().put(`/problem/${insertedId}`).set(auth(adminToken)).send({ difficulty: 'Medium' });
    expect(res.status).toBe(200);
    expect(res.body.problem.slug).toBe('legacy-problem');
    await Problem.deleteOne({ _id: insertedId });
  });
});

describe('scripts/addSlugsToProblems.js', () => {
  let fx;
  beforeAll(async () => {
    await connect();
    await resetData();
    fx = await seed();
  });
  afterAll(disconnect);

  const runScript = (...args) =>
    execFileSync(process.execPath, ['scripts/addSlugsToProblems.js', ...args], {
      cwd: BACKEND,
      env: { PATH: process.env.PATH, MONGO_URI: process.env.MONGO_URI },
      encoding: 'utf8',
    });

  it('dry-runs by default, then adds unique slugs with --apply, and is idempotent', async () => {
    const problems = mongoose.connection.db.collection('problems');
    const { _id: fixtureId, ...doc } = fx.problem.toObject();
    delete doc.slug;
    // Legacy documents: one clashes with the existing "double-it", two share a title shape
    await problems.insertMany([
      { ...doc, title: 'Double It!', number: 10 },
      { ...doc, title: 'Two Sum', number: 11 },
      { ...doc, title: 'Two  Sum?', number: 12, slug: null },
    ]);

    const dry = runScript();
    expect(dry).toMatch(/without: 3/);
    expect(dry).toMatch(/Dry run only/);
    expect(await problems.countDocuments({ slug: { $type: 'string' } })).toBe(1);

    const applied = runScript('--apply');
    expect(applied).toMatch(/Added a slug to 3 problem/);
    const slugs = (await problems.find({}, { projection: { title: 1, slug: 1 } }).sort({ number: 1 }).toArray()).map((p) => p.slug);
    expect(slugs).toEqual(['double-it', 'double-it-2', 'two-sum', 'two-sum-2']);
    expect(slugs[0]).toBe(fx.problem.slug);
    expect(await problems.countDocuments({ _id: fixtureId, slug: 'double-it' })).toBe(1);

    const again = runScript('--apply');
    expect(again).toMatch(/without: 0/);
    expect(again).toMatch(/Added a slug to 0 problem/);
  });
});
