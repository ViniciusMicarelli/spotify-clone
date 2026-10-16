import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const testDirectory = mkdtempSync(join(tmpdir(), 'spotify-test-'));
process.env.DATA_DIR = testDirectory;
const { default: app } = await import('../api-gateway/index.js');
const { database } = await import('../data/store.js');
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); database.close(); rmSync(testDirectory, { recursive: true, force: true }); });
async function request(path, method = 'GET', body, token) {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
test('health, catalog, search and not-found responses', async () => {
  assert.equal((await request('/health')).data.status, 'ok');
  for (const resource of ['tracks', 'albums', 'artists', 'playlists']) {
    const result = await request(`/api/v1/${resource}`);
    assert.equal(result.status, 200);
    assert.ok(result.data.data.length > 0);
    assert.equal((await request(`/api/v1/${resource}/missing`)).status, 404);
  }
  const tracks = await request('/api/v1/tracks?search=Digital');
  assert.equal(tracks.data.data.length, 1);
  assert.equal(tracks.data.data[0].title, 'Digital Dreams');
  assert.equal(typeof tracks.data.data[0].duration, 'number');
  assert.match(tracks.data.data[0].url, /^\/api\/v1\/audio\//);
});
test('signup, duplicate prevention, signin, identity and token rejection', async () => {
  assert.equal((await request('/api/v1/auth/signup', 'POST', {})).status, 400);
  const fields = { username: 'integration_user', email: 'integration@example.com', password: 'password123' };
  const signup = await request('/api/v1/auth/signup', 'POST', fields);
  assert.equal(signup.status, 201);
  assert.ok(signup.data.token);
  assert.equal(signup.data.user.password, undefined);
  assert.equal((await request('/api/v1/auth/signup', 'POST', fields)).status, 409);
  const signin = await request('/api/v1/auth/signin', 'POST', fields);
  assert.equal(signin.status, 200);
  const me = await request('/api/v1/auth/me', 'GET', undefined, signin.data.token);
  assert.equal(me.data.user.id, signup.data.user.id);
  assert.equal(me.data.user.password, undefined);
  assert.equal((await request('/api/v1/auth/me')).status, 401);
  assert.equal((await request('/api/v1/auth/me', 'GET', undefined, 'invalid')).status, 401);
  assert.equal((await request('/api/v1/auth/signin', 'POST', { ...fields, password: 'wrong' })).status, 401);
});
test('demo login and authenticated playlist creation', async () => {
  assert.equal((await request('/api/v1/playlists', 'POST', { name: 'Test' })).status, 401);
  const login = await request('/api/v1/auth/signin', 'POST', { username: 'demo_user', password: 'password123' });
  assert.equal(login.status, 200);
  const playlist = await request('/api/v1/playlists', 'POST', { name: 'Integration Playlist' }, login.data.token);
  assert.equal(playlist.status, 201);
  assert.equal(playlist.data.data.owner.id, '1');
  assert.equal((await request(`/api/v1/playlists/${playlist.data.data.id}`)).data.data.name, 'Integration Playlist');
});

test('unified profile, owner permissions, validation and playlist durations', async () => {
  const owner = await request('/api/v1/auth/signup', 'POST', { username: 'owner', email: 'owner@example.com', password: 'password123' });
  const other = await request('/api/v1/auth/signup', 'POST', { username: 'other', email: 'other@example.com', password: 'password123' });
  const token = owner.data.token;
  const profile = `/api/v1/users/${owner.data.user.id}`;
  assert.equal((await request(profile)).status, 401);
  assert.equal((await request(profile, 'GET', undefined, other.data.token)).status, 403);
  assert.equal((await request(profile, 'PUT', { name: 'Updated Owner' }, token)).data.data.password, undefined);
  assert.equal((await request('/api/v1/auth/me', 'GET', undefined, token)).data.user.name, 'Updated Owner');
  assert.equal((await request(profile, 'PUT', { role: 'admin' }, token)).status, 403);
  assert.equal((await request('/api/v1/tracks', 'POST', { title: 'Forbidden' }, token)).status, 403);
  const playlist = await request('/api/v1/playlists', 'POST', { name: 'Private', public: false, tracks: ['2', '1', '2'] }, token);
  assert.equal(playlist.status, 201);
  assert.equal(playlist.data.data.owner.name, 'Updated Owner');
  assert.deepEqual(playlist.data.data.tracks, ['2', '1']);
  const path = `/api/v1/playlists/${playlist.data.data.id}`;
  assert.equal((await request(path)).status, 404);
  assert.equal((await request(path, 'GET', undefined, other.data.token)).status, 404);
  assert.ok(!(await request('/api/v1/playlists', 'GET', undefined, other.data.token)).data.data.some(p => p.id === playlist.data.data.id));
  for (const [method, suffix, body] of [['PUT', '', { name: 'Hacked' }], ['DELETE', '', undefined], ['POST', '/tracks', { trackIds: ['3'] }], ['DELETE', '/tracks/1', undefined]]) {
    assert.equal((await request(path + suffix, method, body, other.data.token)).status, 403);
  }
  assert.equal((await request(path + '/tracks', 'POST', { trackIds: '1' }, token)).status, 400);
  assert.equal((await request(path + '/tracks', 'POST', { trackIds: ['missing'] }, token)).status, 400);
  const add = await request(path + '/tracks', 'POST', { trackIds: ['3', '1'] }, token);
  assert.deepEqual(add.data.data.tracks, ['2', '1', '3']);
  assert.deepEqual(add.data.data.duration, { ms: 30000, formatted: '0:30' });
  const remove = await request(path + '/tracks/2', 'DELETE', undefined, token);
  assert.deepEqual(remove.data.data.tracks, ['1', '3']);
  assert.deepEqual(remove.data.data.duration, { ms: 20000, formatted: '0:20' });
  assert.equal((await request(path + '/tracks/2', 'DELETE', undefined, token)).status, 404);
  assert.equal((await request(path, 'PUT', { name: 'Renamed', public: true }, token)).data.data.name, 'Renamed');
  assert.equal((await request(path)).status, 200);
  assert.equal((await request(path, 'DELETE', undefined, token)).status, 200);
  assert.equal((await request(path, 'GET', undefined, token)).status, 404);
  assert.equal((await request(`/api/v1/users/${other.data.user.id}`, 'DELETE', undefined, other.data.token)).status, 200);
  assert.equal((await request('/api/v1/auth/me', 'GET', undefined, other.data.token)).status, 401);
});

test('account, playlist and session survive a fresh process', async () => {
  const login = await request('/api/v1/auth/signup', 'POST', { username: 'persistent_user', name: 'Persistent User', email: 'persistent@example.com', password: 'password123' });
  const playlist = await request('/api/v1/playlists', 'POST', { name: 'Persistent', tracks: ['3', '1'] }, login.data.token);
  await request(`/api/v1/playlists/${playlist.data.data.id}/tracks/order`, 'PUT', { trackIds: ['1', '3'] }, login.data.token);
  await request('/api/v1/me/liked-tracks/2', 'PUT', {}, login.data.token);
  const script = `
    const { default: app } = await import('./api-gateway/index.js');
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const headers = { Authorization: 'Bearer ' + process.env.TEST_TOKEN };
    const me = await fetch(base + '/api/v1/auth/me', { headers });
    const playlist = await fetch(base + '/api/v1/playlists/' + process.env.TEST_PLAYLIST, { headers });
    const signin = await fetch(base + '/api/v1/auth/signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'persistent_user', password: 'password123' }) });
    const favorites = await fetch(base + '/api/v1/me/liked-tracks', { headers });
    console.log(JSON.stringify({ favorites: (await favorites.json()).trackIds, status: me.status, user: (await me.json()).user, playlist: (await playlist.json()).data, signinStatus: signin.status }));
    server.close();
  `;
  const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd: new URL('../', import.meta.url), env: { ...process.env, TEST_TOKEN: login.data.token, TEST_PLAYLIST: playlist.data.data.id }, encoding: 'utf8' }));
  assert.equal(result.status, 200);
  assert.equal(result.signinStatus, 200);
  assert.equal(result.user.name, 'Persistent User');
  assert.equal(result.user.password, undefined);
  assert.deepEqual(result.playlist.tracks, ['1', '3']);
  assert.deepEqual(result.favorites, ['2']);
});

test('reordering preserves membership and rejects other owners and invalid permutations', async () => {
  const account = await request('/api/v1/auth/signup', 'POST', { username: 'reorder', email: 'reorder@example.com', password: 'password123' });
  const stranger = await request('/api/v1/auth/signin', 'POST', { username: 'demo_user', password: 'password123' });
  const token = account.data.token;
  const created = await request('/api/v1/playlists', 'POST', { name: 'Ordering', tracks: ['1', '2', '3'] }, token);
  const path = `/api/v1/playlists/${created.data.data.id}`;
  assert.equal((await request(path + '/tracks/order', 'PUT', { trackIds: ['3', '1', '2'] })).status, 401);
  assert.equal((await request(path + '/tracks/order', 'PUT', { trackIds: ['3', '1', '2'] }, stranger.data.token)).status, 403);
  for (const trackIds of [null, '321', ['1', '2'], ['1', '1', '3'], ['1', '2', 'missing'], ['1', '2', '3', '3']]) {
    assert.equal((await request(path + '/tracks/order', 'PUT', { trackIds }, token)).status, 400);
    assert.deepEqual((await request(path)).data.data.tracks, ['1', '2', '3']);
  }
  const reorder = await request(path + '/tracks/order', 'PUT', { trackIds: ['3', '1', '2'] }, token);
  assert.equal(reorder.status, 200);
  assert.deepEqual(reorder.data.data.tracks, ['3', '1', '2']);
  assert.deepEqual(reorder.data.data.duration, created.data.data.duration);
  assert.deepEqual((await request(path)).data.data.tracks, ['3', '1', '2']);
  const empty = await request('/api/v1/playlists', 'POST', { name: 'Empty' }, token);
  assert.equal((await request(`/api/v1/playlists/${empty.data.data.id}/tracks/order`, 'PUT', { trackIds: [] }, token)).status, 200);
});

test('favorites are private per account, idempotent, and validate track existence', async () => {
  const first = await request('/api/v1/auth/signup', 'POST', { username: 'likes_a', email: 'likes-a@example.com', password: 'password123' });
  const second = await request('/api/v1/auth/signup', 'POST', { username: 'likes_b', email: 'likes-b@example.com', password: 'password123' });
  const path = '/api/v1/me/liked-tracks';
  for (const method of ['GET', 'PUT', 'DELETE']) assert.equal((await request(path + (method === 'GET' ? '' : '/1'), method)).status, 401);
  assert.deepEqual((await request(path, 'GET', undefined, first.data.token)).data.trackIds, []);
  assert.equal((await request(path + '/missing', 'PUT', {}, first.data.token)).status, 404);
  for (let i = 0; i < 2; i++) {
    const liked = await request(path + '/2', 'PUT', { userId: second.data.user.id }, first.data.token);
    assert.equal(liked.status, 200);
    assert.deepEqual(liked.data.trackIds, ['2']);
    assert.equal(liked.data.data[0].title, 'Digital Dreams');
  }
  assert.deepEqual((await request(path, 'GET', undefined, second.data.token)).data.trackIds, []);
  await request(path + '/1', 'PUT', {}, first.data.token);
  assert.deepEqual((await request(path, 'GET', undefined, first.data.token)).data.trackIds, ['2', '1']);
  for (let i = 0; i < 2; i++) assert.deepEqual((await request(path + '/2', 'DELETE', undefined, first.data.token)).data.trackIds, ['1']);
});

test('demo audio is decodable PCM with duration matching the catalog and supports range requests', async () => {
  const catalog = (await request('/api/v1/tracks')).data.data;
  for (const track of catalog) {
    const response = await fetch(base + track.url);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /audio\/(wav|wave|x-wav)/);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WAVE');
    assert.equal(bytes.readUInt16LE(20), 1); // PCM format
    const byteRate = bytes.readUInt32LE(28);
    assert.equal(bytes.readUInt32LE(40) / byteRate * 1000, track.duration);
    const range = await fetch(base + track.url, { headers: { Range: 'bytes=0-43' } });
    assert.equal(range.status, 206);
    assert.equal((await range.arrayBuffer()).byteLength, 44);
    assert.match(range.headers.get('content-range'), /^bytes 0-43\//);
  }
});

test('profile changes propagate to playlist owners and account removal cleans private data', async () => {
  const signup = await request('/api/v1/auth/signup', 'POST', { username: 'profile', email: 'profile@example.com', password: 'password123' });
  const token = signup.data.token;
  const path = `/api/v1/users/${signup.data.user.id}`;
  const playlist = await request('/api/v1/playlists', 'POST', { name: 'Profile playlist' }, token);
  await request('/api/v1/me/liked-tracks/1', 'PUT', {}, token);
  assert.equal((await request(path, 'PUT', { name: ' ' }, token)).status, 400);
  assert.equal((await request(path, 'PUT', { avatar: 'javascript:alert(1)' }, token)).status, 400);
  const updated = await request(path, 'PUT', { name: 'Profile Updated', avatar: 'https://example.com/avatar.png' }, token);
  assert.equal(updated.data.data.name, 'Profile Updated');
  assert.equal(updated.data.data.password, undefined);
  const detail = await request(`/api/v1/playlists/${playlist.data.data.id}`);
  assert.equal(detail.data.data.owner.name, 'Profile Updated');
  assert.equal(detail.data.data.owner.avatar, 'https://example.com/avatar.png');
  await request(path, 'DELETE', undefined, token);
  assert.equal((await request(`/api/v1/playlists/${playlist.data.data.id}`)).status, 404);
  const { PersistentMap } = await import('../data/store.js');
  assert.equal(new PersistentMap('favorites').has(signup.data.user.id), false);
});
