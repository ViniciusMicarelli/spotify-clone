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
    run('INSERT INTO catalog_albums(id,name,images,uri,metadata) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,images=excluded.images,uri=excluded.uri,metadata=excluded.metadata', value.id, value.name, JSON.stringify(value.images || []), value.uri || `spotify:album:${value.id}`, extra(value, ['id','name','images','uri','artists','tracks','totalTracks']));
    links('catalog_album_artists', 'album_id', value.id, [...new Set(value.artists || [])]);
  } else {
    run('INSERT INTO catalog_tracks(id,title,duration,album_id,url,uri,metadata) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,duration=excluded.duration,album_id=excluded.album_id,url=excluded.url,uri=excluded.uri,metadata=excluded.metadata', value.id, value.title, value.duration, value.album.id, value.url, value.uri || `spotify:track:${value.id}`, extra(value, ['id','title','duration','album','albumId','artists','url','uri','duration_formatted','album_uri']));
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
    return value && { ...JSON.parse(value.metadata), id, name: value.name, followers: value.followers, images: JSON.parse(value.images), genres: rows('SELECT genre FROM catalog_artist_genres WHERE artist_id=? ORDER BY position', id).map(item => item.genre) };
  }
  if (kind === 'albums') {
    const value = row('SELECT * FROM catalog_albums WHERE id=?', id);
    return value && { ...JSON.parse(value.metadata), id, name: value.name, images: JSON.parse(value.images), uri: value.uri, artists: ids('catalog_album_artists','album_id',id), totalTracks: row('SELECT count(*) AS count FROM catalog_tracks WHERE album_id=?',id).count };
  }
  const value = row('SELECT t.*, a.name AS album_name, a.uri AS album_uri FROM catalog_tracks t JOIN catalog_albums a ON a.id=t.album_id WHERE t.id=?',id);
  return value && { ...JSON.parse(value.metadata), id, title: value.title, duration: value.duration, url: value.url, uri: value.uri, artists: ids('catalog_track_artists','track_id',id), album: { id: value.album_id, name: value.album_name, uri: value.album_uri } };
}
export function trackDetails(track) { return { ...track, artistDetails: track.artists.map(id => ({ id, name: getCatalog('artists',id).name })) }; }
export function catalogValues(kind) { return rows(`SELECT id FROM catalog_${kind} ORDER BY rowid`).map(value => getCatalog(kind, value.id)); }
function validUrl(value) {
  if (typeof value !== 'string') return false;
  if (value.startsWith('/api/v1/audio/')) return !value.includes('..');
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
export function saveCatalog(kind, body, id) {
  return transaction(() => {
    const current = id && getCatalog(kind, id);
    if (id && !current) fail('Registro não encontrado.', 404);
    const allowed = kind === 'artists' ? ['name','images','followers','genres'] : kind === 'albums' ? ['name','images','artists'] : ['title','duration','artists','album','albumId','url'];
    if (!body || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) fail('Campos de catálogo inválidos.');
    const value = { ...(current || { id: randomUUID(), createdAt: new Date().toISOString() }), ...body };
    const name = kind === 'tracks' ? 'title' : 'name';
    if (typeof value[name] !== 'string' || !value[name].trim() || value[name].trim().length > 200) fail('Informe um nome ou título válido (até 200 caracteres).');
    value[name] = value[name].trim();
    if (kind !== 'tracks') {
      value.images ??= [];
      if (!Array.isArray(value.images) || !value.images.every(image => image && validUrl(image.url))) fail('Imagens inválidas.');
    }
    if (kind === 'artists') {
      value.followers ??= 0; value.genres ??= [];
      if (!Number.isSafeInteger(value.followers) || value.followers < 0 || !Array.isArray(value.genres) || !value.genres.every(genre => typeof genre === 'string' && genre.trim())) fail('Seguidores ou gêneros inválidos.');
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
