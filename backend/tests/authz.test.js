import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connect, disconnect, resetData, seed, api, login, auth, PASSWORDS } from './helpers/app.js';

let fx;
let userToken;
let adminToken;
beforeAll(async () => {
  await connect();
  await resetData();
  fx = await seed();
  userToken = await login('user@test.local', PASSWORDS.user);
  adminToken = await login('admin@test.local', PASSWORDS.admin);
});
afterAll(disconnect);

// Every admin-only route: anonymous -> 401, normal user -> 403
const adminRoutes = () => {
  const id = String(fx.problem._id);
  return [
    ['GET', '/admin/dashboard'],
    ['POST', '/problem/', { title: 'x' }],
    ['PUT', `/problem/${id}`, { title: 'x' }],
    ['DELETE', `/problem/${id}`],
    ['GET', `/problem/${id}/admin`],
    ['POST', '/user/admin/register', { firstName: 'A', email: 'x@test.local', password: 'GoodPass#123' }],
    ['GET', '/submission/health'],
  ];
};

const call = (method, path, body, token) => {
  let req = api()[method.toLowerCase()](path);
  if (token) req = req.set(auth(token));
  return body ? req.send(body) : req;
};

describe('authorization matrix', () => {
  it('anonymous callers get 401 on every admin route', async () => {
    for (const [method, path, body] of adminRoutes()) {
      const res = await call(method, path, body);
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it('normal users get 403 on every admin route', async () => {
    for (const [method, path, body] of adminRoutes()) {
      const res = await call(method, path, body, userToken);
      expect(res.status, `${method} ${path}`).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    }
  });

  it('admins reach the admin-only read endpoints', async () => {
    expect((await call('GET', '/admin/dashboard', null, adminToken)).status).toBe(200);
    const full = await call('GET', `/problem/${fx.problem._id}/admin`, null, adminToken);
    expect(full.status).toBe(200);
    expect(full.body.problem.hiddenTestCases).toHaveLength(2);
  });

  it('the role is read from the database, not the token', async () => {
    const { User } = await import('./helpers/app.js');
    await User.updateOne({ _id: fx.admin._id }, { $set: { role: 'user' } });
    expect((await call('GET', '/admin/dashboard', null, adminToken)).status).toBe(403);
    await User.updateOne({ _id: fx.admin._id }, { $set: { role: 'admin' } });
  });

  it('user-only routes need a token', async () => {
    for (const path of ['/user/profile', '/user/check', `/problem/${fx.problem._id}`, `/problem/submissions/${fx.problem._id}`]) {
      expect((await api().get(path)).status, path).toBe(401);
    }
  });
});
