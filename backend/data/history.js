import { database as db, transaction } from './store.js';
import { getCatalog, trackDetails } from './catalog.js';

transaction(() => db.exec(`CREATE TABLE IF NOT EXISTS listening_history (
  sequence INTEGER PRIMARY KEY AUTOINCREMENT,
  user_collection TEXT NOT NULL DEFAULT 'users' CHECK(user_collection='users'),
  user_id TEXT NOT NULL,
  playback_id TEXT NOT NULL,
  track_id TEXT NOT NULL REFERENCES catalog_tracks(id) ON DELETE CASCADE,
  played_at TEXT NOT NULL,
  UNIQUE(user_id,playback_id),
  FOREIGN KEY(user_collection,user_id) REFERENCES records(collection,key) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS listening_history_user ON listening_history(user_id,sequence DESC);`));
export function recordListen(userId, playbackId, trackId) {
  return transaction(() => {
    if (!getCatalog('tracks', trackId)) throw Object.assign(new Error('Faixa não encontrada.'), { status: 404 });
    const current = db.prepare('SELECT track_id FROM listening_history WHERE user_id=? AND playback_id=?').get(userId, playbackId);
    if (current && current.track_id !== trackId) throw Object.assign(new Error('Reprodução já associada a outra faixa.'), { status: 409 });
    db.prepare('INSERT OR IGNORE INTO listening_history(user_id,playback_id,track_id,played_at) VALUES (?,?,?,?)').run(userId, playbackId, trackId, new Date().toISOString());
    return { success: true };
  });
}
export function clearHistory(userId) { db.prepare('DELETE FROM listening_history WHERE user_id=?').run(userId); }
export function listeningHistory(userId, { limit, offset }) {
  db.exec('SAVEPOINT history_page');
  try {
    const total = db.prepare('SELECT count(*) AS n FROM listening_history WHERE user_id=?').get(userId).n;
    const data = db.prepare('SELECT playback_id,track_id,played_at FROM listening_history WHERE user_id=? ORDER BY sequence DESC LIMIT ? OFFSET ?').all(userId, limit, offset)
      .map(item => ({ ...trackDetails(getCatalog('tracks', item.track_id)), playbackId: item.playback_id, playedAt: item.played_at }));
    db.exec('RELEASE history_page');
    return { data, pagination: { limit, offset, total } };
  } catch (error) { db.exec('ROLLBACK TO history_page; RELEASE history_page'); throw error; }
}
