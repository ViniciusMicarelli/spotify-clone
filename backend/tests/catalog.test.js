import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'spotify-catalog-api-'));
const { default: app } = await import('../api-gateway/index.js');
const { usersDB } = await import('../data/users.js');
const { database } = await import('../data/store.js');
const { deleteCatalog, getCatalog } = await import('../data/catalog.js');
let server, base, token;
before(async () => {
  usersDB.set('1', { ...usersDB.get('1'), role: 'admin' });
  server = app.listen(0,'127.0.0.1'); await new Promise(resolve => server.once('listening',resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;
  token = (await request('/auth/signin','POST',{ username: 'demo_user', password: 'password123' })).data.token;
});
after(async () => { await new Promise(resolve => server.close(resolve)); database.close(); rmSync(process.env.DATA_DIR,{ recursive: true, force: true }); });
async function request(path,method='GET',body) {
  const response = await fetch(base+path,{ method,headers:{ 'Content-Type':'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status,data: await response.json() };
}
async function create(kind,body) { const result=await request('/'+kind,'POST',body); assert.equal(result.status,201,JSON.stringify(result.data)); return result.data.data; }
test('normalized CRUD updates album names, artist search, track moves and derived counts',async () => {
  const artist=await create('artists',{ name:'Relational Artist',genres:['Indie'],followers:0 });
  const first=await create('albums',{ name:'First Album',artists:[artist.id] });
  const second=await create('albums',{ name:'Second Album',artists:[artist.id] });
  const track=await create('tracks',{ title:'Relational Track',duration:31000,albumId:first.id,artists:[artist.id],url:'/api/v1/audio/demo-1.wav' });
  assert.equal((await request(`/albums/${first.id}`)).data.data.totalTracks,1);
  await request(`/albums/${first.id}`,'PUT',{ name:'Renamed Album' });
  assert.equal((await request(`/tracks/${track.id}`)).data.data.album.name,'Renamed Album');
  await request(`/artists/${artist.id}`,'PUT',{ name:'Updated Artist' });
  const search=await request('/tracks?search=Updated%20Artist');
  assert.ok(search.data.data.some(item=>item.id===track.id));
  assert.equal(search.data.data.find(item=>item.id===track.id).artistDetails[0].name,'Updated Artist');
  assert.ok((await request('/tracks?search=Renamed%20Album')).data.data.some(item=>item.id===track.id));
  await request(`/tracks/${track.id}`,'PUT',{ albumId:second.id });
  assert.equal((await request(`/albums/${first.id}`)).data.data.totalTracks,0);
  assert.equal((await request(`/albums/${second.id}`)).data.data.totalTracks,1);
  assert.equal((await request('/tracks?albumId='+second.id)).data.data[0].id,track.id);
  assert.equal((await request(`/albums/${second.id}`,'DELETE')).status,409);
  assert.equal((await request(`/artists/${artist.id}`,'DELETE')).status,409);
  assert.throws(()=>database.prepare('DELETE FROM catalog_albums WHERE id=?').run(second.id),/FOREIGN KEY/);
  await request(`/tracks/${track.id}`,'DELETE');
  assert.equal((await request(`/albums/${second.id}`,'DELETE')).status,200);
  await request(`/albums/${first.id}`,'DELETE');
  assert.equal((await request(`/artists/${artist.id}`,'DELETE')).status,200);
  assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(),[]);
});
test('invalid metadata, relations, URLs and pagination fail without partial catalog writes',async () => {
  const before=database.prepare('SELECT count(*) AS n FROM catalog_tracks').get().n;
  for (const body of [
    { title:'Bad',duration:-1,artists:['1'],albumId:'1',url:'/api/v1/audio/demo-1.wav' },
    { title:'Bad',duration:1000,artists:['missing'],albumId:'1',url:'/api/v1/audio/demo-1.wav' },
    { title:'Bad',duration:1000,artists:['1','1'],albumId:'1',url:'/api/v1/audio/demo-1.wav' },
    { title:'Bad',duration:1000,artists:['1'],albumId:'missing',url:'/api/v1/audio/demo-1.wav' },
    { title:'Bad',duration:1000,artists:['1'],albumId:'1',url:'javascript:alert(1)' },
    { title:'Bad',duration:1000,artists:['1'],album:null,url:'/api/v1/audio/demo-1.wav' }
  ]) assert.equal((await request('/tracks','POST',body)).status,400);
  assert.equal(database.prepare('SELECT count(*) AS n FROM catalog_tracks').get().n,before);
  assert.equal((await request('/albums','POST',{ name:'Bad',artists:['missing'] })).status,400);
  assert.equal((await request('/artists','POST',{ name:'Bad',followers:-1 })).status,400);
  assert.equal((await request('/albums/1','PUT',{ tracks:['1'] })).status,400);
  assert.equal((await request('/tracks?limit=0')).status,400);
  assert.equal((await request('/tracks?search=a&search=b')).status,400);
  assert.equal((await request('/tracks?offset=-1')).status,400);
});
test('track duration edits and deletion update playlists and favorites atomically',async () => {
  const track=await create('tracks',{ title:'Cleanup Track',duration:61000,artists:['1'],albumId:'1',url:'/api/v1/audio/demo-1.wav' });
  const playlist=await create('playlists',{ name:'Cleanup Playlist',tracks:[track.id,'2'] });
  await request('/me/liked-tracks/'+track.id,'PUT',{});
  await request('/tracks/'+track.id,'PUT',{ duration:51000 });
  assert.deepEqual((await request('/playlists/'+playlist.id)).data.data.duration,{ ms:61000,formatted:'1:01' });
  database.exec("CREATE TRIGGER fail_cleanup BEFORE UPDATE ON records WHEN OLD.collection='favorites' BEGIN SELECT RAISE(ABORT, 'forced cleanup failure'); END");
  try { assert.throws(()=>deleteCatalog('tracks',track.id),/forced cleanup failure/); }
  finally { database.exec('DROP TRIGGER fail_cleanup'); }
  assert.ok(getCatalog('tracks',track.id));
  assert.ok((await request('/playlists/'+playlist.id)).data.data.tracks.includes(track.id));
  assert.ok((await request('/me/liked-tracks')).data.trackIds.includes(track.id));
  assert.equal((await request('/tracks/'+track.id,'DELETE')).status,200);
  const updated=(await request('/playlists/'+playlist.id)).data.data;
  assert.deepEqual(updated.tracks,['2']); assert.deepEqual(updated.duration,{ ms:10000,formatted:'0:10' });
  assert.ok(!(await request('/me/liked-tracks')).data.trackIds.includes(track.id));
});
test('catalog migration preserves legacy snapshots, runs once and rolls back invalid references',t => {
  const path=mkdtempSync(join(tmpdir(),'spotify-catalog-migration-'));
  t.after(()=>rmSync(path,{ recursive:true,force:true }));
  const artists=[['a',{ id:'a',name:'Legacy Artist',genres:['Rock'],followers:3,biography:'Preserved' }]];
  const albums=[['b',{ id:'b',name:'Legacy Album',artists:['a'] }]];
  const tracks=[['t',{ id:'t',title:'Legacy Track',duration:12345,artists:['a'],album:{ id:'missing',name:'Old' },url:'https://example.com/audio.mp3' }]];
  for (const [name,data] of Object.entries({ artists,albums,tracks })) writeFileSync(join(path,name+'.json'),JSON.stringify(data));
  const store=new URL('../data/store.js',import.meta.url).href;
  const catalog=new URL('../data/catalog.js',import.meta.url).href;
  const run=code=>execFileSync(process.execPath,['--input-type=module','-e',code],{ env:{ ...process.env,DATA_DIR:path },encoding:'utf8',stdio:['pipe','pipe','pipe'] });
  assert.throws(()=>run(`await import(${JSON.stringify(catalog)});`));
  const result=JSON.parse(run(`
    const { database, PersistentMap }=await import(${JSON.stringify(store)});
    const absent=!database.prepare("SELECT value FROM metadata WHERE key='catalog_version'").get();
    const source=new PersistentMap('tracks'); const value=source.get('t'); source.set('t',{ ...value,album:{ id:'b',name:'Stale' } });
    const { getCatalog,saveCatalog }=await import(${JSON.stringify(catalog)});
    const migrated=getCatalog('tracks','t'); saveCatalog('artists',{ name:'Changed' },'a');
    console.log(JSON.stringify({ absent,album:migrated.album.name,duration:migrated.duration,biography:getCatalog('artists','a').biography,snapshot:new PersistentMap('artists').get('a').name })); database.close();
  `));
  assert.deepEqual(result,{ absent:true,album:'Legacy Album',duration:12345,biography:'Preserved',snapshot:'Legacy Artist' });
  assert.equal(run(`const {getCatalog}=await import(${JSON.stringify(catalog)}); console.log(getCatalog('artists','a').name);`).trim(),'Changed');
});

test('playlist track pages retain explicit order beyond 100 tracks and protect private contents', async () => {
  const { saveCatalog } = await import('../data/catalog.js');
  const { transaction } = await import('../data/store.js');
  const ids = transaction(() => Array.from({ length: 103 }, (_, index) => saveCatalog('tracks', { title: `Paged ${index + 1}`, duration: 8000, artists: ['1'], albumId: '1', url: '/api/v1/audio/demo-1.wav' }).id)).reverse();
  const playlist = await create('playlists', { name: '103 tracks', public: false, tracks: ids });
  const path = '/playlists/'+playlist.id+'/tracks';
  const first = await request(path+'?limit=20&offset=0');
  const last = await request(path+'?limit=20&offset=100');
  assert.equal(first.data.pagination.total, 103);
  assert.deepEqual(first.data.data.map(track => track.id), ids.slice(0,20));
  assert.deepEqual(last.data.data.map(track => track.id), ids.slice(100));
  assert.equal(last.data.data[0].artistDetails[0].name, 'Artist 1');
  assert.deepEqual((await request(path+'?offset=103')).data.data, []);
  assert.equal((await request(path+'?limit=101')).status, 400);
  assert.equal((await request(path+'?offset=1&offset=2')).status, 400);
  assert.equal((await fetch(base+path)).status, 404);
  const signup = await request('/auth/signup','POST',{ username:'page_viewer',email:'pages@example.com',password:'password123' });
  assert.equal((await fetch(base+path,{ headers:{ Authorization:'Bearer '+signup.data.token } })).status, 404);
});
