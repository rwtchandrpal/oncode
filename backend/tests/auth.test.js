import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connect, disconnect, resetData, seed, api, login, auth, PASSWORDS } from './helpers/app.js';

let fx;
beforeAll(async () => {
  await connect();
  await resetData();
  fx = await seed();
});
afterAll(disconnect);

const expectErrorShape = (res) => {
  expect(res.body.error).toEqual(expect.objectContaining({ code: expect.any(String), message: expect.any(String) }));
};

describe('register', () => {
  it('creates a user and returns a token (empty lastName allowed)', async () => {
    const res = await api().post('/user/register').send({ firstName: 'New', lastName: '', email: 'New@Test.Local', password: 'GoodPass#123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'new@test.local', role: 'user' });
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('rejects unknown fields (mass assignment) and weak or over-long passwords', async () => {
    const extra = await api().post('/user/register').send({ firstName: 'A', email: 'a1@test.local', password: 'GoodPass#123', role: 'admin' });
    expect(extra.status).toBe(400);
    expectErrorShape(extra);
    const weak = await api().post('/user/register').send({ firstName: 'A', email: 'a2@test.local', password: 'short' });
    expect(weak.status).toBe(400);
    const long = await api().post('/user/register').send({ firstName: 'A', email: 'a3@test.local', password: 'Aa1!' + 'x'.repeat(69) });
    expect(long.status).toBe(400);
    expect(long.body.error.message).toMatch(/72 bytes/);
  });

  it('rejects a duplicate email', async () => {
    const res = await api().post('/user/register').send({ firstName: 'Dup', email: 'user@test.local', password: 'GoodPass#123' });
    expect(res.status).toBe(400);
  });
});

describe('login', () => {
  it('logs in with a normalized email', async () => {
    const res = await api().post('/user/login').send({ email: '  USER@test.local ', password: PASSWORDS.user });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('answers wrong password and unknown email identically', async () => {
    const wrong = await api().post('/user/login').send({ email: 'user@test.local', password: 'Wrong#Pass1' });
    const unknown = await api().post('/user/login').send({ email: 'nobody@test.local', password: 'Wrong#Pass1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  // SEC-01 regression: query operators in the login body must never reach MongoDB
  it.each([
    ['$ne email with the real admin password', { email: { $ne: null }, password: PASSWORDS.admin }],
    ['$ne on both fields', { email: { $ne: null }, password: { $ne: null } }],
    ['$regex email', { email: { $regex: '^adm' }, password: 'x' }],
    ['$gt email', { email: { $gt: '' }, password: PASSWORDS.admin }],
    ['array email', { email: ['admin@test.local'], password: PASSWORDS.admin }],
  ])('SEC-01: %s -> 400 and no token', async (_name, body) => {
    const res = await api().post('/user/login').send(body);
    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user).toBeUndefined();
    expectErrorShape(res);
  });
});

describe('logout', () => {
  it('revokes the token', async () => {
    const token = await login('other@test.local', PASSWORDS.other);
    expect((await api().get('/user/check').set(auth(token))).status).toBe(200);
    expect((await api().post('/user/logout').set(auth(token))).status).toBe(200);
    const after = await api().get('/user/check').set(auth(token));
    expect(after.status).toBe(401);
    expectErrorShape(after);
  });

  it('rejects garbage and tampered tokens with 401', async () => {
    expect((await api().get('/user/check').set(auth('garbage'))).status).toBe(401);
    const token = await login('user@test.local', PASSWORDS.user);
    const [h, p, s] = token.split('.');
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
    const forged = [h, Buffer.from(JSON.stringify({ ...payload, role: 'admin' })).toString('base64url'), s].join('.');
    expect((await api().get('/user/check').set(auth(forged))).status).toBe(401);
  });
});

describe('error contract', () => {
  it('malformed JSON -> 400 INVALID_JSON; unknown route -> 404', async () => {
    const bad = await api().post('/user/login').set('Content-Type', 'application/json').send('{bad');
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('INVALID_JSON');
    const nf = await api().get('/nope');
    expect(nf.status).toBe(404);
    expectErrorShape(nf);
  });

  it('has security headers and no X-Powered-By', async () => {
    const res = await api().get('/healthz');
    expect(res.status).toBe(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(fx.admin).toBeTruthy();
  });

  it('GET /api/health answers without auth, uncached, with CORS for the SPA origin', async () => {
    const res = await api().get('/api/health').set('Origin', process.env.CLIENT_URL || 'http://localhost:5173');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['access-control-allow-origin']).toBeTruthy();
  });
});
