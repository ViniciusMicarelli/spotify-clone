import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import jwt from 'jsonwebtoken';
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'spotify-sessions-'));
const { default: app } = await import('../api-gateway/index.js');
const { sessionsDB, refreshTokensDB, JWT_SECRET } = await import('../data/sessions.js');
const { database } = await import('../data/store.js');
let server, base;
before(async () => { server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { await new Promise(resolve => server.close(resolve)); database.close(); rmSync(process.env.DATA_DIR, { recursive: true, force: true }); });
async function request(path, { method = 'POST', body, cookie, token, origin } = {}) {
  const response = await fetch(base + '/api/v1' + path, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(origin ? { Origin: origin } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0], setCookie: response.headers.get('set-cookie'), cache: response.headers.get('cache-control') };
}
const signin = () => request('/auth/signin', { body: { username: 'demo_user', password: 'password123' } });
test('signin sets an HttpOnly cookie, exposes only access credentials, and stores hashes', async () => {
  const login = await signin();
  assert.equal(login.status, 200);
  assert.match(login.setCookie, /HttpOnly/); assert.match(login.setCookie, /SameSite=Strict/); assert.match(login.setCookie, /Path=\/api\/v1\/auth/);
  assert.equal(login.cache, 'no-store'); assert.equal(login.data.expiresIn, 900);
  assert.equal(login.data.refreshToken, undefined);
  assert.equal(login.data.user.password, undefined);
  const decoded = jwt.decode(login.data.token);
  assert.equal(decoded.exp - decoded.iat, 900);
  assert.ok(sessionsDB.has(decoded.sid));
  const raw = decodeURIComponent(login.cookie.split('=')[1]);
  assert.ok(!JSON.stringify([...refreshTokensDB]).includes(raw));
});
test('expired access is rejected and rotated refresh returns usable access', async () => {
  const login = await signin();
  const { userId, sid } = jwt.decode(login.data.token);
  const expired = jwt.sign({ userId, sid, kind: 'access' }, JWT_SECRET, { issuer: 'spotify-clone', expiresIn: -1 });
  assert.equal((await request('/auth/me', { method: 'GET', token: expired })).status, 401);
  const refresh = await request('/auth/refresh', { cookie: login.cookie });
  assert.equal(refresh.status, 200); assert.notEqual(refresh.cookie, login.cookie); assert.notEqual(refresh.data.token, login.data.token);
  assert.equal((await request('/auth/me', { method: 'GET', token: refresh.data.token })).status, 200);
});
test('refresh reuse revokes its family without affecting a separate login', async () => {
  const first = await signin(); const other = await signin();
  const rotated = await request('/auth/refresh', { cookie: first.cookie });
  assert.equal(rotated.status, 200);
  assert.equal((await request('/auth/refresh', { cookie: first.cookie })).status, 401);
  assert.equal((await request('/auth/refresh', { cookie: rotated.cookie })).status, 401);
  assert.equal((await request('/auth/me', { method: 'GET', token: rotated.data.token })).status, 401);
  assert.equal((await request('/auth/me', { method: 'GET', token: other.data.token })).status, 200);
});
test('signout revokes access immediately, clears the cookie, and is idempotent', async () => {
  const login = await signin();
  const logout = await request('/auth/signout', { cookie: login.cookie });
  assert.equal(logout.status, 200); assert.match(logout.setCookie, /Expires=Thu, 01 Jan 1970/);
  assert.equal((await request('/auth/me', { method: 'GET', token: login.data.token })).status, 401);
  assert.equal((await request('/auth/refresh', { cookie: login.cookie })).status, 401);
  assert.equal((await request('/auth/signout', { cookie: login.cookie })).status, 200);
});
test('missing, malformed, expired refresh and untrusted origins cannot renew a session', async () => {
  assert.equal((await request('/auth/refresh')).status, 401);
  assert.equal((await request('/auth/refresh', { cookie: 'spotify_refresh=%bad' })).status, 401);
  const login = await signin();
  const { sid } = jwt.decode(login.data.token);
  sessionsDB.set(sid, { ...sessionsDB.get(sid), expiresAt: Date.now() - 1 });
  assert.equal((await request('/auth/refresh', { cookie: login.cookie })).status, 401);
  assert.equal((await request('/auth/signin', { body: { username: 'demo_user', password: 'password123' }, origin: 'https://untrusted.example' })).status, 403);
  assert.equal((await request('/auth/refresh', { cookie: login.cookie, origin: 'https://untrusted.example' })).status, 403);
});
