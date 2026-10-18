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


test('SQL catalog pages preserve literal Unicode search, relation filters, order and totals', async () => {
  const { saveCatalog, catalogValues, trackDetails } = await import('../data/catalog.js');
  const artist = saveCatalog('artists', { name: 'ÁRVORE %_ Símbolo', genres: ['Ação'] });
  const album = saveCatalog('albums', { name: 'ÁLBUM Especial', artists: [artist.id, '1'] });
  saveCatalog('tracks', { title: 'Título %_ literal', duration: 8000, artists: [artist.id, '1'], albumId: album.id, url: '/api/v1/audio/demo-1.wav' });
  saveCatalog('tracks', { title: 'Outra faixa', duration: 8000, artists: [], albumId: album.id, url: '/api/v1/audio/demo-1.wav' });
  for (const kind of ['artists', 'albums', 'tracks']) {
    const all = catalogValues(kind);
    for (const filters of [
      {}, { search: 'árvore' }, { search: '%_' }, { search: "' OR 1=1 --" },
      { search: 'símbolo artist 1' }, { search: 'álbum especial' },
      { artistId: artist.id }, { albumId: album.id }, { genre: 'Ação' },
      { artistId: artist.id, albumId: album.id, search: 'título' }, { search: '  ' }
    ]) {
      const expected = all.filter(value => {
        const names = kind === 'tracks' ? value.artists.map(id => getCatalog('artists', id).name).join(' ') : '';
        return `${value.name || value.title} ${names} ${value.album?.name || ''}`.toLowerCase().includes((filters.search || '').toLowerCase())
          && (!filters.artistId || value.artists?.includes(filters.artistId))
          && (!filters.albumId || value.album?.id === filters.albumId)
          && (!filters.genre || value.genres?.includes(filters.genre));
      });
      for (const offset of [0, 2, 100, 999]) {
        const query = new URLSearchParams({ ...filters, limit: '2', offset: String(offset) });
        const response = await request(`/${kind}?${query}`);
        assert.equal(response.status, 200);
        assert.deepEqual(response.data.pagination, { limit: 2, offset, total: expected.length });
        assert.deepEqual(response.data.data, expected.slice(offset, offset + 2).map(value => kind === 'tracks' ? trackDetails(value) : value));
      }
    }
  }
});

test('artist biography, country, photos and genres validate atomically and persist across processes', async () => {
  const artist = await create('artists', { name: 'Metadata Artist', biography: '  Linha um.\nLinha dois <b>literal</b>.  ', country: ' Brasil ', genres: [' Jazz ', 'Jazz', 'Instrumental'], images: [{ url: '/api/v1/images/artist-demo.svg', width: 320, height: 320 }] });
  assert.equal(artist.biography, 'Linha um.\nLinha dois <b>literal</b>.');
  assert.equal(artist.country, 'Brasil');
  assert.deepEqual(artist.genres, ['Jazz', 'Instrumental']);
  const before = getCatalog('artists', artist.id);
  for (const fields of [
    { biography: null }, { biography: 3 }, { biography: 'x'.repeat(5001) },
    { country: {} }, { country: null }, { country: 'x'.repeat(101) },
    { genres: ['x'.repeat(81)] }, { genres: Array(21).fill('Jazz') }, { genres: {} },
    { images: [{ url: 'javascript:alert(1)' }] }, { images: [{ url: 'https://user:secret@example.com/a.jpg' }] },
    { images: [{ url: '/api/v1/images/../audio/demo-1.wav' }] },
    { images: [{ url: '/api/v1/images/artist-demo.svg', width: -1 }] },
    { images: [{ url: 'https://example.com/a.jpg', height: 1.5 }] },
    { images: Array(11).fill({ url: 'https://example.com/a.jpg' }) }
  ]) {
    assert.equal((await request('/artists/' + artist.id, 'PUT', { name: 'Should not persist', ...fields })).status, 400);
    assert.deepEqual(getCatalog('artists', artist.id), before);
  }
  assert.equal((await request('/artists/' + artist.id, 'PUT', { images: [{ url: 'https://example.com/a.jpg' }] })).status, 200);
  const module = new URL('../data/catalog.js', import.meta.url).href;
  const persisted = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `const {getCatalog}=await import(${JSON.stringify(module)}); console.log(JSON.stringify(getCatalog('artists',${JSON.stringify(artist.id)})));`], { encoding: 'utf8', env: process.env }));
  assert.equal(persisted.biography, before.biography);
  assert.equal(persisted.country, 'Brasil');
  assert.equal((await fetch(base + '/artists/' + artist.id)).status, 200);
  assert.equal((await fetch(base + '/artists/' + artist.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ biography: 'Unauthorized' }) })).status, 401);
  const signup = await request('/auth/signup', 'POST', { username: 'metadata_viewer', email: 'metadata@example.com', password: 'password123' });
  assert.equal((await fetch(base + '/artists/' + artist.id, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + signup.data.token }, body: JSON.stringify({ biography: 'Forbidden' }) })).status, 403);
  const cleared = await request('/artists/' + artist.id, 'PUT', { biography: '', country: '', genres: [], images: [] });
  assert.equal(cleared.data.data.biography, ''); assert.equal(cleared.data.data.country, '');
  assert.deepEqual(cleared.data.data.images, []);
});

test('album metadata persists and duration follows track edits, moves and deletion', async () => {
  const album = await create('albums', { name: 'Metadata Album', year: 2024, genres: [' Jazz ', 'Jazz'], artists: ['1'], images: [{ url: '/api/v1/images/album-demo.svg', width: 320, height: 320 }] });
  assert.deepEqual(album.genres, ['Jazz']);
  assert.deepEqual(album.duration, { ms: 0, formatted: '0:00' });
  for (const fields of [{ year: '2024' }, { year: 0 }, { year: 10000 }, { year: 1.5 }, { genres: [''] }, { genres: ['x'.repeat(81)] }, { images: [{ url: 'data:image/png;base64,AAAA' }] }, { images: [{ url: 'https://example.com/a.jpg', width: -1 }] }, { duration: { ms: 999 } }]) {
    assert.equal((await request('/albums/' + album.id, 'PUT', { name: 'Invalid change', ...fields })).status, 400);
    assert.equal(getCatalog('albums', album.id).name, 'Metadata Album');
  }
  const first = await create('tracks', { title: 'First metadata track', duration: 61000, artists: ['1'], albumId: album.id, url: '/api/v1/audio/demo-1.wav' });
  const second = await create('tracks', { title: 'Second metadata track', duration: 8000, artists: ['1'], albumId: album.id, url: '/api/v1/audio/demo-1.wav' });
  assert.deepEqual(getCatalog('albums', album.id).duration, { ms: 69000, formatted: '1:09' });
  await request('/tracks/' + first.id, 'PUT', { duration: 62000 });
  assert.equal(getCatalog('albums', album.id).duration.ms, 70000);
  await request('/tracks/' + second.id, 'PUT', { albumId: '1' });
  assert.equal(getCatalog('albums', album.id).totalTracks, 1);
  assert.equal(getCatalog('albums', album.id).duration.ms, 62000);
  const module = new URL('../data/catalog.js', import.meta.url).href;
  const persisted = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `const {getCatalog}=await import(${JSON.stringify(module)}); console.log(JSON.stringify(getCatalog('albums',${JSON.stringify(album.id)})));`], { encoding: 'utf8', env: process.env }));
  assert.equal(persisted.year, 2024); assert.deepEqual(persisted.genres, ['Jazz']); assert.equal(persisted.duration.ms, 62000);
  await request('/tracks/' + first.id, 'DELETE');
  assert.deepEqual(getCatalog('albums', album.id).duration, { ms: 0, formatted: '0:00' });
  assert.equal((await request('/albums/' + album.id, 'PUT', { year: null, genres: [], images: [] })).data.data.year, null);
  await request('/tracks/' + second.id, 'DELETE');
  await request('/albums/' + album.id, 'DELETE');
});

test('track technical metadata is derived, read-only and absent for external or missing audio', async () => {
  const demo = (await request('/tracks/1')).data.data;
  assert.equal(demo.technical.codec, 'PCM'); assert.equal(demo.technical.bitrate, 256000);
  assert.equal((await request('/tracks/1', 'PUT', { technical: { codec: 'MP3' } })).status, 400);
  const track = await create('tracks', { title: 'Technical source', duration: 12000, artists: ['1'], albumId: '1', url: '/api/v1/audio/demo-1.wav' });
  assert.equal(track.technical.durationMs, 8000); assert.equal(track.duration, 12000);
  assert.equal((await request('/tracks/' + track.id, 'PUT', { url: 'https://example.com/audio.mp3' })).data.data.technical, null);
  assert.equal((await request('/tracks/' + track.id, 'PUT', { url: '/api/v1/audio/missing.wav' })).data.data.technical, null);
  await request('/tracks/' + track.id, 'DELETE');
});

test('waveform route is public, bounded and nullable without altering track responses', async () => {
  const response = await fetch(base + '/tracks/1/waveform');
  assert.equal(response.status, 200);
  const waveform = (await response.json()).data;
  assert.equal(waveform.peaks.length, 96); assert.equal(waveform.durationMs, 8000);
  assert.equal((await request('/tracks/missing/waveform')).status, 404);
  assert.equal((await request('/tracks/1')).data.data.waveform, undefined);
  const track = await create('tracks', { title: 'No waveform', duration: 1000, artists: [], albumId: '1', url: 'https://example.com/audio.mp3' });
  assert.equal((await request('/tracks/' + track.id + '/waveform')).data.data, null);
  await request('/tracks/' + track.id, 'DELETE');
});

test('public genre inventory is distinct, reflects catalog edits and combines with paginated search', async () => {
  const artist = await create('artists', { name: 'Genre Inventory', genres: ['Inventário & Jazz', 'Pop'] });
  const response = await fetch(base + '/artists/genres'); assert.equal(response.status, 200);
  const genres = (await response.json()).data;
  assert.equal(genres.filter(genre => genre === 'Pop').length, 1);
  assert.ok(genres.includes('Inventário & Jazz'));
  const page = await request('/artists?' + new URLSearchParams({ search: 'Genre', genre: 'Inventário & Jazz', limit: '1', offset: '0' }));
  assert.equal(page.data.pagination.total, 1); assert.equal(page.data.data[0].id, artist.id);
  assert.equal((await request('/artists?genre=missing')).data.pagination.total, 0);
  await request('/artists/' + artist.id, 'DELETE');
  assert.ok(!(await request('/artists/genres')).data.data.includes('Inventário & Jazz'));
});

test('album artist filter combines search with stable pages and includes collaborations once', async () => {
  const { saveCatalog } = await import('../data/catalog.js');
  const albums = Array.from({ length: 25 }, (_, index) => saveCatalog('albums', { name: `Album Artist Filter ${index}`, artists: ['1', '2'] }));
  for (const artistId of ['1', '2']) {
    const result = await request('/albums?' + new URLSearchParams({ artistId, search: 'Album Artist Filter', limit: '10', offset: '20' }));
    assert.equal(result.data.pagination.total, 25);
    assert.deepEqual(result.data.data.map(album => album.id), albums.slice(20).map(album => album.id));
  }
  assert.equal((await request('/albums?artistId=missing&search=Album%20Artist%20Filter')).data.pagination.total, 0);
  assert.equal((await request('/albums?artistId=1&artistId=2')).status, 400);
});

test('album year filter validates input and combines year, artist, title and SQL pagination', async () => {
  const { saveCatalog } = await import('../data/catalog.js');
  const albums = Array.from({ length: 25 }, (_, index) => saveCatalog('albums', { name: `Year Filter ${index}`, year: 2024, artists: ['1','2'] }));
  saveCatalog('albums', { name: 'Year Filter other', year: 2023, artists: ['1'] });
  saveCatalog('albums', { name: 'Year Filter unknown', artists: ['1'] });
  const result = await request('/albums?search=Year%20Filter&year=2024&artistId=2&limit=10&offset=20');
  assert.equal(result.data.pagination.total, 25);
  assert.deepEqual(result.data.data.map(album => album.id), albums.slice(20).map(album => album.id));
  assert.equal((await request('/albums?search=Year%20Filter&year=2023')).data.pagination.total, 1);
  assert.equal((await request('/albums?year=9999')).data.pagination.total, 0);
  for (const year of ['', '0','10000','02024','-1','2024.5','abc','1e3']) assert.equal((await request('/albums?year=' + year)).status, 400);
  assert.equal((await request('/albums?year=2023&year=2024')).status, 400);
  assert.equal((await request('/artists?year=2024')).status, 400);
});
