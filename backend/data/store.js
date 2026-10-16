import { mkdirSync, readFileSync, existsSync, chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const dataDirectory = resolve(process.env.DATA_DIR || fileURLToPath(new URL('../.data/', import.meta.url)));
mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
export const databasePath = join(dataDirectory, 'spotify.sqlite');
export const database = new DatabaseSync(databasePath);
chmodSync(databasePath, 0o600);
database.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
let depth = 0;
export function transaction(callback) {
  const level = depth++;
  try {
    database.exec(level ? `SAVEPOINT nested_${level}` : 'BEGIN IMMEDIATE');
    const result = callback();
    if (result && typeof result.then === 'function') throw new Error('Database transactions require synchronous callbacks.');
    database.exec(level ? `RELEASE nested_${level}` : 'COMMIT');
    return result;
  } catch (error) {
    if (database.isTransaction) {
      if (level) database.exec(`ROLLBACK TO nested_${level}; RELEASE nested_${level}`);
      else database.exec('ROLLBACK');
    }
    throw error;
  } finally { depth--; }
}

// Import every legacy collection together. Invalid input rolls the entire migration back.
transaction(() => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS collections (name TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS records (
      collection TEXT NOT NULL REFERENCES collections(name),
      key TEXT NOT NULL,
      value TEXT NOT NULL CHECK(json_valid(value)),
      PRIMARY KEY (collection, key)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS unique_username ON records(lower(trim(json_extract(value, '$.username')))) WHERE collection = 'users';
    CREATE UNIQUE INDEX IF NOT EXISTS unique_email ON records(lower(trim(json_extract(value, '$.email')))) WHERE collection = 'users';
  `);
  const version = database.prepare("SELECT value FROM metadata WHERE key = 'schema_version'").get();
  if (version) {
    if (version.value !== '1') throw new Error(`Unsupported database schema: ${version.value}`);
    return;
  }
  for (const name of ['users', 'settings', 'tracks', 'albums', 'artists', 'playlists', 'favorites']) {
    const path = join(dataDirectory, `${name}.json`);
    if (!existsSync(path)) continue;
    const entries = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(entries) || !entries.every(entry => Array.isArray(entry) && entry.length === 2 && typeof entry[0] === 'string' && entry[1] !== undefined)) throw new Error(`Invalid legacy collection: ${path}`);
    database.prepare('INSERT INTO collections(name) VALUES (?)').run(name);
    const insert = database.prepare('INSERT INTO records(collection, key, value) VALUES (?, ?, ?)');
    for (const [key, value] of entries) insert.run(name, key, JSON.stringify(value));
  }
  database.prepare("INSERT INTO metadata(key, value) VALUES ('schema_version', '1')").run();
});

// Map-compatible facade; every read goes to SQLite, never a process-local cache.
export class PersistentMap {
  constructor(name, initial = []) {
    this.name = name;
    transaction(() => {
      const inserted = database.prepare('INSERT OR IGNORE INTO collections(name) VALUES (?)').run(name);
      if (inserted.changes) for (const [key, value] of initial) this.set(key, value);
    });
  }
  get size() { return database.prepare('SELECT count(*) AS count FROM records WHERE collection = ?').get(this.name).count; }
  get(key) {
    const row = database.prepare('SELECT value FROM records WHERE collection = ? AND key = ?').get(this.name, key);
    return row ? JSON.parse(row.value) : undefined;
  }
  has(key) { return Boolean(database.prepare('SELECT 1 FROM records WHERE collection = ? AND key = ?').get(this.name, key)); }
  *entries() {
    const rows = database.prepare('SELECT key, value FROM records WHERE collection = ? ORDER BY rowid').all(this.name);
    for (const row of rows) yield [row.key, JSON.parse(row.value)];
  }
  *keys() { for (const [key] of this.entries()) yield key; }
  *values() { for (const [, value] of this.entries()) yield value; }
  [Symbol.iterator]() { return this.entries(); }
  forEach(callback, thisArg) { for (const [key, value] of this.entries()) callback.call(thisArg, value, key, this); }
  set(key, value) {
    database.prepare('INSERT INTO records(collection, key, value) VALUES (?, ?, ?) ON CONFLICT(collection, key) DO UPDATE SET value = excluded.value').run(this.name, key, JSON.stringify(value));
    return this;
  }
  delete(key) { return Boolean(database.prepare('DELETE FROM records WHERE collection = ? AND key = ?').run(this.name, key).changes); }
  clear() { database.prepare('DELETE FROM records WHERE collection = ?').run(this.name); }
}
