import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import mongoose from 'mongoose';
import { connect, disconnect, resetData, seed, api, login, auth, PASSWORDS, Problem } from './helpers/app.js';

const require = createRequire(import.meta.url);
const { slugify } = require('../src/utils/slug.js');

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
  let fx, userToken;
  beforeAll(async () => {
    await connect();
    await resetData();
    fx = await seed();
    userToken = await login('user@test.local', PASSWORDS.user);
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
});

