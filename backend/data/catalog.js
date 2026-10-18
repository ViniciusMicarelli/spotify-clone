import { audioMetadata } from './audio-metadata.js';
import { randomUUID } from 'node:crypto';
import { database as db, PersistentMap, transaction } from './store.js';
import { mockArtists, mockAlbums, mockTracks } from './catalog-seed.js';

const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const kinds = ['artists', 'albums', 'tracks'];
const rows = (sql, ...args) => db.prepare(sql).all(...args);
const row = (sql, ...args) => db.prepare(sql).get(...args);
const run = (sql, ...args) => db.prepare(sql).run(...args);
const extra = (value, keys) => JSON.stringify(Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key))));
const ids = (table, column, id) => rows(`SELECT artist_id FROM ${table} WHERE ${column} = ? ORDER BY position`, id).map(value => value.artist_id);
function links(table, column, id, artists) {
  run(`DELETE FROM ${table} WHERE ${column} = ?`, id);
  artists.forEach((artist, position) => run(`INSERT INTO ${table}(${column}, artist_id, position) VALUES (?, ?, ?)`, id, artist, position));
}
function write(kind, value) {
  if (kind === 'artists') {
    run('INSERT INTO catalog_artists(id,name,followers,images,metadata) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,followers=excluded.followers,images=excluded.images,metadata=excluded.metadata', value.id, value.name, value.followers || 0, JSON.stringify(value.images || []), extra(value, ['id','name','followers','images','genres']));
    run('DELETE FROM catalog_artist_genres WHERE artist_id = ?', value.id);
    [...new Set(value.genres || [])].forEach((genre, position) => run('INSERT INTO catalog_artist_genres VALUES (?,?,?)', value.id, genre, position));
  } else if (kind === 'albums') {
    run('INSERT INTO catalog_albums(id,name,images,uri,metadata) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,images=excluded.images,uri=excluded.uri,metadata=excluded.metadata', value.id, value.name, JSON.stringify(value.images || []), value.uri || `spotify:album:${value.id}`, extra(value, ['id','name','images','uri','artists','tracks','totalTracks','duration']));
    links('catalog_album_artists', 'album_id', value.id, [...new Set(value.artists || [])]);
  } else {
    run('INSERT INTO catalog_tracks(id,title,duration,album_id,url,uri,metadata) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,duration=excluded.duration,album_id=excluded.album_id,url=excluded.url,uri=excluded.uri,metadata=excluded.metadata', value.id, value.title, value.duration, value.album.id, value.url, value.uri || `spotify:track:${value.id}`, extra(value, ['id','title','duration','album','albumId','artists','url','uri','duration_formatted','album_uri','technical']));
    links('catalog_track_artists', 'track_id', value.id, [...new Set(value.artists || [])]);
  }
}
transaction(() => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS catalog_artists(id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(length(trim(name)) > 0), followers INTEGER NOT NULL CHECK(followers >= 0), images TEXT NOT NULL CHECK(json_valid(images)), metadata TEXT NOT NULL CHECK(json_valid(metadata)));
    CREATE TABLE IF NOT EXISTS catalog_artist_genres(artist_id TEXT NOT NULL REFERENCES catalog_artists(id) ON DELETE CASCADE, genre TEXT NOT NULL, position INTEGER NOT NULL, PRIMARY KEY(artist_id, genre));
    CREATE TABLE IF NOT EXISTS catalog_albums(id TEXT PRIMARY KEY, name TEXT NOT NULL CHECK(length(trim(name)) > 0), images TEXT NOT NULL CHECK(json_valid(images)), uri TEXT NOT NULL, metadata TEXT NOT NULL CHECK(json_valid(metadata)));
    CREATE TABLE IF NOT EXISTS catalog_tracks(id TEXT PRIMARY KEY, title TEXT NOT NULL CHECK(length(trim(title)) > 0), duration INTEGER NOT NULL CHECK(typeof(duration) = 'integer' AND duration > 0), album_id TEXT NOT NULL REFERENCES catalog_albums(id) ON DELETE RESTRICT, url TEXT NOT NULL, uri TEXT NOT NULL, metadata TEXT NOT NULL CHECK(json_valid(metadata)));
    CREATE TABLE IF NOT EXISTS catalog_album_artists(album_id TEXT NOT NULL REFERENCES catalog_albums(id) ON DELETE CASCADE, artist_id TEXT NOT NULL REFERENCES catalog_artists(id) ON DELETE RESTRICT, position INTEGER NOT NULL, PRIMARY KEY(album_id, artist_id), UNIQUE(album_id, position));
    CREATE TABLE IF NOT EXISTS catalog_track_artists(track_id TEXT NOT NULL REFERENCES catalog_tracks(id) ON DELETE CASCADE, artist_id TEXT NOT NULL REFERENCES catalog_artists(id) ON DELETE RESTRICT, position INTEGER NOT NULL, PRIMARY KEY(track_id, artist_id), UNIQUE(track_id, position));
    CREATE INDEX IF NOT EXISTS catalog_tracks_album ON catalog_tracks(album_id);
    CREATE INDEX IF NOT EXISTS catalog_track_artist ON catalog_track_artists(artist_id);
    CREATE INDEX IF NOT EXISTS catalog_album_artist ON catalog_album_artists(artist_id);
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS artist_follows (
      user_collection TEXT NOT NULL DEFAULT 'users' CHECK(user_collection='users'),
      user_id TEXT NOT NULL,
      artist_id TEXT NOT NULL REFERENCES catalog_artists(id) ON DELETE CASCADE,
      PRIMARY KEY(user_id, artist_id),
      FOREIGN KEY(user_collection,user_id) REFERENCES records(collection,key) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS artist_follows_artist ON artist_follows(artist_id);
  `);
  const version = row("SELECT value FROM metadata WHERE key='catalog_version'");
  if (version) { if (version.value !== '1') fail('Versão de catálogo não suportada.', 500); return; }
  const sources = { artists: mockArtists, albums: mockAlbums, tracks: mockTracks };
  for (const kind of kinds) {
    const source = new PersistentMap(kind, sources[kind].map(value => [value.id, value]));
    for (const [id, original] of source) {
      if (!original || original.id !== id) fail(`Registro de catálogo inválido: ${kind}/${id}. Corrija a origem antes de migrar.`, 500);
      const value = structuredClone(original);
      const seed = kind === 'tracks' && mockTracks.find(track => track.id === id);
      if (seed && value.url === `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${id}.mp3`) { value.url = seed.url; value.duration = seed.duration; }
      write(kind, value);
    }
  }
  run("INSERT INTO metadata(key,value) VALUES ('catalog_version','1')");
});

export function getCatalog(kind, id) {
  if (kind === 'artists') {
    const value = row('SELECT * FROM catalog_artists WHERE id=?', id);
    return value && { ...JSON.parse(value.metadata), id, name: value.name, followers: value.followers + row('SELECT count(*) AS n FROM artist_follows WHERE artist_id=?', id).n, images: JSON.parse(value.images), genres: rows('SELECT genre FROM catalog_artist_genres WHERE artist_id=? ORDER BY position', id).map(item => item.genre) };
  }
  if (kind === 'albums') {
    const value = row('SELECT * FROM catalog_albums WHERE id=?', id);
    if (!value) return;
    const totals = row('SELECT count(*) AS count, COALESCE(sum(duration),0) AS ms FROM catalog_tracks WHERE album_id=?', id);
    return { ...JSON.parse(value.metadata), id, name: value.name, images: JSON.parse(value.images), uri: value.uri, artists: ids('catalog_album_artists','album_id',id), totalTracks: totals.count, duration: { ms: totals.ms, formatted: `${Math.floor(totals.ms / 60000)}:${String(Math.floor(totals.ms / 1000) % 60).padStart(2,'0')}` } };
  }
  const value = row('SELECT t.*, a.name AS album_name, a.uri AS album_uri FROM catalog_tracks t JOIN catalog_albums a ON a.id=t.album_id WHERE t.id=?',id);
  return value && { ...JSON.parse(value.metadata), id, title: value.title, duration: value.duration, url: value.url, uri: value.uri, technical: audioMetadata(value.url), artists: ids('catalog_track_artists','track_id',id), album: { id: value.album_id, name: value.album_name, uri: value.album_uri } };
}
export function trackDetails(track) { return { ...track, artistDetails: track.artists.map(id => ({ id, name: getCatalog('artists',id).name })) }; }
export function catalogValues(kind) { return rows(`SELECT id FROM catalog_${kind} ORDER BY rowid`).map(value => getCatalog(kind, value.id)); }
// Match JavaScript's Unicode casing and literal substring semantics in SQL.
db.function('catalog_lower', { deterministic: true }, value => value.toLowerCase());
export function listCatalog(kind, { limit, offset, search = '', artistId, albumId, genre }) {
  if (!kinds.includes(kind)) throw new Error('Tipo de catálogo inválido.');
  const predicates = [], parameters = [];
  if (search) {
    const text = kind === 'tracks'
      ? `c.title || ' ' || COALESCE((SELECT group_concat(name, ' ') FROM
          (SELECT a.name FROM catalog_track_artists ca JOIN catalog_artists a ON a.id=ca.artist_id
           WHERE ca.track_id=c.id ORDER BY ca.position)), '') || ' ' ||
          (SELECT name FROM catalog_albums WHERE id=c.album_id)`
      : "c.name || '  '";
    predicates.push(`instr(catalog_lower(${text}), ?) > 0`);
    parameters.push(search.toLowerCase());
  }
  if (artistId) {
    predicates.push(kind === 'artists' ? '0' : `EXISTS (SELECT 1 FROM catalog_${kind === 'tracks' ? 'track' : 'album'}_artists ca WHERE ca.${kind === 'tracks' ? 'track' : 'album'}_id=c.id AND ca.artist_id=?)`);
    if (kind !== 'artists') parameters.push(artistId);
  }
  if (albumId) { predicates.push(kind === 'tracks' ? 'c.album_id=?' : '0'); if (kind === 'tracks') parameters.push(albumId); }
  if (genre) { predicates.push(kind === 'artists' ? 'EXISTS (SELECT 1 FROM catalog_artist_genres cg WHERE cg.artist_id=c.id AND cg.genre=?)' : '0'); if (kind === 'artists') parameters.push(genre); }
  const from = `FROM catalog_${kind} c${predicates.length ? ' WHERE ' + predicates.join(' AND ') : ''}`;
  // A read snapshot keeps count, page and metadata consistent across processes.
  // Only page IDs are hydrated, without loading unrelated records.
  db.exec('SAVEPOINT catalog_page');
  try {
    const total = row(`SELECT count(*) AS total ${from}`, ...parameters).total;
    const data = rows(`SELECT c.id ${from} ORDER BY c.rowid LIMIT ? OFFSET ?`, ...parameters, limit, offset)
      .map(({ id }) => { const value = getCatalog(kind, id); return kind === 'tracks' ? trackDetails(value) : value; });
    db.exec('RELEASE catalog_page');
    return { data, pagination: { limit, offset, total } };
  } catch (error) {
    db.exec('ROLLBACK TO catalog_page; RELEASE catalog_page');
    throw error;
  }
}
function validUrl(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('/api/v1/audio/')) return !value.includes('..');
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
export function saveCatalog(kind, body, id) {
  return transaction(() => {
    const current = id && getCatalog(kind, id);
    if (current && kind === 'artists') current.followers = row('SELECT followers FROM catalog_artists WHERE id=?', id).followers;
    if (id && !current) fail('Registro não encontrado.', 404);
    const allowed = kind === 'artists' ? ['name','images','followers','genres','biography','country'] : kind === 'albums' ? ['name','images','artists','year','genres'] : ['title','duration','artists','album','albumId','url'];
    if (!body || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) fail('Campos de catálogo inválidos.');
    const value = { ...(current || { id: randomUUID(), createdAt: new Date().toISOString() }), ...body };
    const name = kind === 'tracks' ? 'title' : 'name';
    if (typeof value[name] !== 'string' || !value[name].trim() || value[name].trim().length > 200) fail('Informe um nome ou título válido (até 200 caracteres).');
    value[name] = value[name].trim();
    if (kind !== 'tracks') {
      value.images ??= [];
      if (!Array.isArray(value.images) || !value.images.every(image => image && (validUrl(image.url) || (typeof image.url === 'string' && image.url.startsWith('/api/v1/images/'))))) fail('Imagens inválidas.');
    }
    if (kind !== 'tracks') {
      if (value.images.length > 10 || !value.images.every(image => {
        if (!image || Array.isArray(image) || Object.keys(image).some(key => !['url','width','height'].includes(key)) || typeof image.url !== 'string' || image.url.length > 2048) return false;
        const local = /^\/api\/v1\/images\/[a-zA-Z0-9_-]+\.(svg|png|jpg|jpeg|webp)$/.test(image.url);
        let remote = false;
        try { const url = new URL(image.url); remote = ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; } catch { /* Local URL. */ }
        return (local || remote) && ['width','height'].every(key => image[key] === undefined || (Number.isSafeInteger(image[key]) && image[key] > 0 && image[key] <= 10000));
      })) fail('Fotos inválidas.');
      value.genres ??= [];
      if (!Array.isArray(value.genres) || value.genres.length > 20 || !value.genres.every(genre => typeof genre === 'string' && genre.trim() && genre.trim().length <= 80)) fail('Gêneros inválidos.');
      value.genres = [...new Set(value.genres.map(genre => genre.trim()))];
    }
    if (kind === 'albums') {
      value.year ??= null;
      if (value.year !== null && (!Number.isSafeInteger(value.year) || value.year < 1 || value.year > 9999)) fail('Ano inválido.');
    }
    if (kind === 'artists') {
      value.biography ??= ''; value.country ??= '';
      for (const [field, max] of [['biography', 5000], ['country', 100]]) {
        if (typeof value[field] !== 'string' || value[field].trim().length > max || body[field] === null) fail('Biografia ou país inválido.');
        value[field] = value[field].trim();
      }
      value.followers ??= 0; value.genres ??= [];
      if (!Number.isSafeInteger(value.followers) || value.followers < 0) fail('Seguidores inválidos.');
    } else {
      value.artists ??= [];
      if (!Array.isArray(value.artists) || new Set(value.artists).size !== value.artists.length || !value.artists.every(artist => typeof artist === 'string' && getCatalog('artists', artist))) fail('Informe IDs únicos de artistas existentes.');
    }
    if (kind === 'tracks') {
      if (body.album !== undefined && (!body.album || typeof body.album !== 'object' || Array.isArray(body.album) || typeof body.album.id !== 'string')) fail('Referência de álbum inválida.');
      const albumId = body.albumId ?? body.album?.id ?? current?.album.id;
      if (body.albumId && body.album && body.albumId !== body.album.id) fail('Referências de álbum conflitantes.');
      if (typeof albumId !== 'string' || !getCatalog('albums', albumId)) fail('Álbum não encontrado.');
      if (!Number.isSafeInteger(value.duration) || value.duration <= 0 || !validUrl(value.url)) fail('Duração ou URL de áudio inválida.');
      value.album = { id: albumId };
    }
    write(kind, value);
    if (kind === 'tracks') refreshCollections();
    return getCatalog(kind, value.id);
  });
}
function refreshCollections(deletedId) {
  for (const record of rows("SELECT collection,key,value FROM records WHERE collection IN ('playlists','favorites')")) {
    const value = JSON.parse(record.value);
    if (record.collection === 'favorites') {
      if (deletedId && value.includes(deletedId)) run('UPDATE records SET value=? WHERE collection=? AND key=?', JSON.stringify(value.filter(id => id !== deletedId)), record.collection, record.key);
    } else {
      if (deletedId) value.tracks = value.tracks.filter(id => id !== deletedId);
      const ms = value.tracks.reduce((sum,id) => sum + (getCatalog('tracks', id)?.duration || 0), 0);
      value.duration = { ms, formatted: `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2,'0')}` };
      run('UPDATE records SET value=? WHERE collection=? AND key=?',JSON.stringify(value),record.collection,record.key);
    }
  }
}
export function deleteCatalog(kind, id) {
  return transaction(() => {
    if (!getCatalog(kind,id)) fail('Registro não encontrado.',404);
    if (kind === 'albums' && row('SELECT 1 FROM catalog_tracks WHERE album_id=?',id)) fail('Remova ou mova as faixas antes de excluir o álbum.',409);
    if (kind === 'artists' && (row('SELECT 1 FROM catalog_album_artists WHERE artist_id=?',id) || row('SELECT 1 FROM catalog_track_artists WHERE artist_id=?',id))) fail('Artista ainda está associado ao catálogo.',409);
    run(`DELETE FROM catalog_${kind} WHERE id=?`,id);
    if (kind === 'tracks') refreshCollections(id);
  });
}
const facade = kind => ({ get: id => getCatalog(kind,id), has: id => Boolean(getCatalog(kind,id)), values: () => catalogValues(kind)[Symbol.iterator]() });
export const tracksDB = facade('tracks');
export const albumsDB = facade('albums');
export const artistsDB = facade('artists');
