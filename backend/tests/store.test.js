import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
const store = new URL('../data/store.js', import.meta.url).href;
function fixture(t) {
  const path = mkdtempSync(join(tmpdir(), 'spotify-sqlite-'));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
}
function run(path, code) {
  return execFileSync(process.execPath, ['--input-type=module', '-e', `const { PersistentMap, transaction, database } = await import(${JSON.stringify(store)}); ${code}`], { env: { ...process.env, DATA_DIR: path }, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}
test('legacy collections import once, preserve credentials and order, and leave originals untouched', t => {
  const path = fixture(t);
  const legacy = { users: [['u', { id: 'u', username: 'legacy', email: 'legacy@example.com', password: 'kept-hash' }]], settings: [['jwtSecret', 'kept-secret']], tracks: [], playlists: [['p', { id: 'p', tracks: ['3', '1'] }]], favorites: [['u', ['2', '1']]] };
  for (const [name, data] of Object.entries(legacy)) writeFileSync(join(path, `${name}.json`), JSON.stringify(data));
  const result = JSON.parse(run(path, `
    const users = new PersistentMap('users'); const settings = new PersistentMap('settings');
    console.log(JSON.stringify({ user: users.get('u'), secret: settings.get('jwtSecret'), playlist: new PersistentMap('playlists').get('p'), likes: new PersistentMap('favorites').get('u'), tracks: new PersistentMap('tracks', [['seed', {}]]).size }));
    users.set('u', { ...users.get('u'), name: 'Changed' }); database.close();
  `));
  assert.equal(result.user.password, 'kept-hash'); assert.equal(result.secret, 'kept-secret');
  assert.deepEqual(result.playlist.tracks, ['3', '1']); assert.deepEqual(result.likes, ['2', '1']); assert.equal(result.tracks, 0);
  assert.equal(run(path, `console.log(new PersistentMap('users').get('u').name); database.close();`).trim(), 'Changed');
  for (const [name, data] of Object.entries(legacy)) assert.deepEqual(JSON.parse(readFileSync(join(path, `${name}.json`))), data);
});
test('invalid legacy data rolls the entire migration back and allows a corrected retry', t => {
  const path = fixture(t);
  writeFileSync(join(path, 'users.json'), JSON.stringify([['u', { username: 'legacy', email: 'legacy@example.com' }]]));
  writeFileSync(join(path, 'playlists.json'), '{broken');
  assert.throws(() => run(path, 'database.close();'));
  const script = `import { DatabaseSync } from 'node:sqlite'; const db=new DatabaseSync(process.env.DATA_DIR + '/spotify.sqlite'); console.log(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='records'").get().n); db.close();`;
  assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, DATA_DIR: path }, encoding: 'utf8' }).trim(), '0');
  writeFileSync(join(path, 'playlists.json'), '[]');
  assert.equal(run(path, `console.log(new PersistentMap('users').get('u').username); database.close();`).trim(), 'legacy');
});
test('multi-collection writes roll back together and nested savepoints isolate failures', t => {
  const path = fixture(t);
  const result = JSON.parse(run(path, `
    const users=new PersistentMap('users'); const playlists=new PersistentMap('playlists');
    try { transaction(() => { users.set('u', { username: 'one', email: 'one@example.com' }); playlists.set('p', { name: 'partial' }); throw new Error('rollback'); }); } catch {}
    const rolledBack=users.size === 0 && playlists.size === 0;
    transaction(() => { users.set('u', { username: 'one', email: 'one@example.com' }); try { transaction(() => { playlists.set('p', {}); throw new Error('nested'); }); } catch {} });
    let unique=false; try { users.set('u2', { username: 'ONE', email: 'other@example.com' }); } catch { unique=true; }
    console.log(JSON.stringify({ rolledBack, userCount: users.size, playlistCount: playlists.size, unique })); database.close();
  `));
  assert.deepEqual(result, { rolledBack: true, userCount: 1, playlistCount: 0, unique: true });
});
test('independent processes serialize read-modify-write transactions without lost updates', async t => {
  const path = fixture(t);
  run(path, `new PersistentMap('counter').set('value', 0); database.close();`);
  const script = `const { PersistentMap, transaction, database } = await import(${JSON.stringify(store)}); const counter=new PersistentMap('counter'); for(let i=0;i<25;i++) transaction(() => counter.set('value', counter.get('value') + 1)); database.close();`;
  await Promise.all([1, 2].map(() => promisify(execFile)(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, DATA_DIR: path } })));
  assert.equal(run(path, `console.log(new PersistentMap('counter').get('value')); database.close();`).trim(), '50');
});
