import { randomUUID } from 'node:crypto';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'spotify-history-'));
const { default: app } = await import('../api-gateway/index.js');
const { database } = await import('../data/store.js');
const { saveCatalog, deleteCatalog } = await import('../data/catalog.js');
let server, base, owner, other;
async function request(path, method = 'GET', token, body) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
  for (const name of ['history_owner', 'history_other']) {
    const response = await request('/auth/signup', 'POST', undefined, { username: name, email: `${name}@example.com`, password: 'password123' });
    if (!owner) owner = response.data; else other = response.data;
  }
});
after(async () => { await new Promise(resolve => server.close(resolve)); database.close(); rmSync(process.env.DATA_DIR, { recursive: true, force: true }); });
const path = '/me/history';
test('history is authenticated, private, idempotent and validates playback records', async () => {
  const id = randomUUID();
  for (const method of ['GET', 'DELETE']) assert.equal((await request(path, method)).status, 401);
  assert.equal((await request(path + '/' + id, 'PUT', undefined, { trackId: '1' })).status, 401);
  for (const body of [{}, { trackId: 1 }, { trackId: '1', userId: other.user.id }]) assert.equal((await request(path + '/' + id, 'PUT', owner.token, body)).status, 400);
  assert.equal((await request(path + '/invalid', 'PUT', owner.token, { trackId: '1' })).status, 400);
  assert.equal((await request(path + '/' + id, 'PUT', owner.token, { trackId: 'missing' })).status, 404);
  for (let i = 0; i < 2; i++) assert.equal((await request(path + '/' + id, 'PUT', owner.token, { trackId: '1' })).status, 200);
  assert.equal((await request(path + '/' + id, 'PUT', owner.token, { trackId: '2' })).status, 409);
  const own = (await request(path, 'GET', owner.token)).data;
  assert.equal(own.pagination.total, 1);
  assert.equal(own.data[0].artistDetails[0].name, 'Artist 1');
  assert.ok(Number.isFinite(Date.parse(own.data[0].playedAt)));
  assert.equal((await request(path + '?userId=' + owner.user.id, 'GET', other.token)).data.pagination.total, 0);
  await request(path + '/' + id, 'PUT', other.token, { trackId: '2' });
  await request(path, 'DELETE', other.token);
  assert.equal((await request(path, 'GET', owner.token)).data.pagination.total, 1);
});
test('history pages are newest first, survive restart and cascade after track/account deletion', async () => {
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  for (const id of ids) await request(path + '/' + id, 'PUT', owner.token, { trackId: '2' });
  const page = (await request(path + '?limit=2&offset=1', 'GET', owner.token)).data;
  assert.deepEqual(page.pagination, { limit: 2, offset: 1, total: 4 });
  assert.deepEqual(page.data.map(item => item.playbackId), [ids[1], ids[0]]);
  assert.deepEqual((await request(path + '?offset=999', 'GET', owner.token)).data.data, []);
  for (const query of ['limit=0', 'limit=101', 'offset=-1', 'offset=1&offset=2']) assert.equal((await request(path + '?' + query, 'GET', owner.token)).status, 400);
  const module = new URL('../data/history.js', import.meta.url).href;
  const persisted = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `const { listeningHistory } = await import(${JSON.stringify(module)}); console.log(JSON.stringify(listeningHistory(${JSON.stringify(owner.user.id)}, {limit:50,offset:0})));`], { encoding: 'utf8', env: process.env }));
  assert.equal(persisted.pagination.total, 4);
  assert.equal(persisted.data[0].playbackId, ids[2]);
  const track = saveCatalog('tracks', { title: 'History cleanup', duration: 8000, artists: ['1'], albumId: '1', url: '/api/v1/audio/demo-1.wav' });
  await request(path + '/' + randomUUID(), 'PUT', owner.token, { trackId: track.id });
  deleteCatalog('tracks', track.id);
  assert.equal((await request(path, 'GET', owner.token)).data.pagination.total, 4);
  await request('/users/' + owner.user.id, 'DELETE', owner.token);
  assert.equal(database.prepare('SELECT count(*) AS n FROM listening_history WHERE user_id=?').get(owner.user.id).n, 0);
  assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(), []);
});
