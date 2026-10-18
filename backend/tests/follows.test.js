import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'spotify-follows-'));
const { default: app } = await import('../api-gateway/index.js');
const { database } = await import('../data/store.js');
const { getCatalog, saveCatalog, deleteCatalog } = await import('../data/catalog.js');
let server, base, owner, other;
async function request(path, method = 'GET', token, body) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
  for (const name of ['follow_owner', 'follow_other']) {
    const response = await request('/auth/signup', 'POST', undefined, { username: name, email: `${name}@example.com`, password: 'password123' });
    if (!owner) owner = response.data; else other = response.data;
  }
});
after(async () => { await new Promise(resolve => server.close(resolve)); database.close(); rmSync(process.env.DATA_DIR, { recursive: true, force: true }); });
const path = '/me/followed-artists';
test('following requires authentication, is idempotent and remains private per account', async () => {
  const initial = getCatalog('artists', '1').followers;
  for (const method of ['GET', 'PUT', 'DELETE']) assert.equal((await request(path + '/1', method)).status, 401);
  assert.equal((await request(path)).status, 401);
  assert.equal((await request(path + '/missing', 'PUT', owner.token)).status, 404);
  assert.equal((await request(path + '/missing', 'GET', owner.token)).status, 404);
  for (let i = 0; i < 2; i++) assert.deepEqual((await request(path + '/1', 'PUT', owner.token)).data, { following: true, followers: initial + 1 });
  assert.equal((await request(path + '/1', 'GET', other.token)).data.following, false);
  assert.deepEqual((await request(path, 'GET', other.token)).data.data, []);
  assert.equal((await request('/artists/1')).data.data.followers, initial + 1);
  await request(path + '/1', 'PUT', other.token);
  for (let i = 0; i < 2; i++) assert.deepEqual((await request(path + '/1', 'DELETE', owner.token)).data, { following: false, followers: initial + 1 });
  assert.equal((await request(path + '/1', 'GET', other.token)).data.following, true);
  await request(path + '/1', 'DELETE', other.token);
  assert.equal(getCatalog('artists', '1').followers, initial);
});
test('follow pages preserve order, survive a fresh process and cascade on artist/account deletion', async () => {
  const artist = saveCatalog('artists', { name: 'Follow fixture', followers: 7 });
  for (const id of ['2', '1', artist.id]) await request(path + '/' + id, 'PUT', owner.token);
  const page = (await request(path + '?limit=1&offset=1', 'GET', owner.token)).data;
  assert.deepEqual(page.pagination, { limit: 1, offset: 1, total: 3 });
  assert.equal(page.data[0].id, '1');
  assert.deepEqual((await request(path + '?offset=999', 'GET', owner.token)).data.data, []);
  for (const query of ['limit=0', 'limit=101', 'offset=-1', 'offset=1&offset=2']) assert.equal((await request(path + '?' + query, 'GET', owner.token)).status, 400);
  const module = new URL('../data/follows.js', import.meta.url).href;
  const persisted = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `const { followedArtists } = await import(${JSON.stringify(module)}); console.log(JSON.stringify(followedArtists(${JSON.stringify(owner.user.id)}, {limit:50,offset:0})));`], { encoding: 'utf8', env: process.env }));
  assert.deepEqual(persisted.data.map(value => value.id), ['2', '1', artist.id]);
  saveCatalog('artists', { name: 'Renamed fixture' }, artist.id);
  assert.equal(getCatalog('artists', artist.id).followers, 8);
  deleteCatalog('artists', artist.id);
  assert.equal((await request(path, 'GET', owner.token)).data.pagination.total, 2);
  await request('/users/' + owner.user.id, 'DELETE', owner.token);
  assert.equal(database.prepare('SELECT count(*) AS n FROM artist_follows WHERE user_id=?').get(owner.user.id).n, 0);
  assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(), []);
});
