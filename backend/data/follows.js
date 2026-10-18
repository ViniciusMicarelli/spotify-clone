import { database as db, transaction } from './store.js';
import { getCatalog } from './catalog.js';

export function followStatus(userId, artistId) {
  const artist = getCatalog('artists', artistId);
  if (!artist) throw Object.assign(new Error('Artista não encontrado.'), { status: 404 });
  return { following: Boolean(db.prepare('SELECT 1 FROM artist_follows WHERE user_id=? AND artist_id=?').get(userId, artistId)), followers: artist.followers };
}
export function setFollowing(userId, artistId, following) {
  return transaction(() => {
    followStatus(userId, artistId);
    db.prepare(following ? 'INSERT OR IGNORE INTO artist_follows(user_id,artist_id) VALUES (?,?)' : 'DELETE FROM artist_follows WHERE user_id=? AND artist_id=?').run(userId, artistId);
    return followStatus(userId, artistId);
  });
}
export function followedArtists(userId, { limit, offset }) {
  db.exec('SAVEPOINT followed_page');
  try {
    const total = db.prepare('SELECT count(*) AS n FROM artist_follows WHERE user_id=?').get(userId).n;
    const data = db.prepare('SELECT artist_id FROM artist_follows WHERE user_id=? ORDER BY rowid LIMIT ? OFFSET ?').all(userId, limit, offset).map(({ artist_id }) => getCatalog('artists', artist_id));
    db.exec('RELEASE followed_page');
    return { data, pagination: { limit, offset, total } };
  } catch (error) { db.exec('ROLLBACK TO followed_page; RELEASE followed_page'); throw error; }
}
