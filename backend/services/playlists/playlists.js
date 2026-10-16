import express from 'express';
import { randomUUID } from 'node:crypto';
import authMiddleware from '../../middleware/auth.js';
import { usersDB } from '../../data/users.js';
import { PersistentMap, transaction } from '../../data/store.js';
import tracks from '../tracks/tracks.js';
const { tracksDB } = tracks;
// Mock playlist data for demo
const mockPlaylists = [
  {
    id: '1',
    name: 'Liked Songs',
    description: 'Liked songs',
    owner: { id: '1', username: 'demo_user', name: 'Demo User', avatar: 'https://placehold.co/64x64/1DB954/FFFFFF?text=D' },
    tracks: ['1'],
    follow: false,
    public: true,
    collaborative: false,
    duration: { ms: 187000, formatted: '3:07' }
  },
  {
    id: '2',
    name: 'Daily Mix 1',
    description: 'Liked songs and trending tracks',
    owner: { id: '1', username: 'demo_user', name: 'Demo User', avatar: 'https://placehold.co/64x64/1DB954/FFFFFF?text=D' },
    tracks: ['1', '2', '3'],
    follow: false,
    public: true,
    collaborative: false,
    duration: { ms: 593000, formatted: '9:53' }
  }
];

// Persistent local store; mock records seed only the first run.
const playlistsDB = new PersistentMap('playlists', mockPlaylists.map(item => [item.id, { ...item, duration: duration(item.tracks) }]));

// Refresh derived durations after catalog/demo metadata changes.
for (const playlist of playlistsDB.values()) {
  const ids = playlist.tracks.filter(id => tracksDB.has(id));
  if (ids.length !== playlist.tracks.length || playlist.duration.ms !== duration(ids).ms) save(playlist);
}


const router = express.Router();
// Public playlists can be read anonymously; valid tokens also reveal the owner's private playlists.
router.use((req, res, next) => req.headers.authorization ? authMiddleware(req, res, next) : next());
router.use((req, res, next) => req.method === 'GET' || req.userId ? next() : res.status(401).json({ error: 'Token de autenticação obrigatório.' }));
const visible = (playlist, userId) => playlist.public || playlist.owner.id === userId;
function duration(ids) {
  const ms = ids.reduce((sum, id) => sum + (tracksDB.get(id)?.duration || 0), 0);
  return { ms, formatted: `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}` };
}
function validTracks(ids) { return Array.isArray(ids) && ids.every(id => typeof id === 'string' && tracksDB.has(id)); }
function save(playlist) {
  // Recompute from remaining catalog items, preserving order and preventing duplicates.
  playlist.tracks = [...new Set(playlist.tracks)].filter(id => tracksDB.has(id));
  playlist.duration = duration(playlist.tracks);
  playlistsDB.set(playlist.id, playlist);
  return playlist;
}
router.get('/', (req, res) => {
  const { search = '', userId, limit = '50', offset = '0' } = req.query;
  if (typeof search !== 'string' || (userId !== undefined && typeof userId !== 'string') || !/^\d+$/.test(String(limit)) || !/^\d+$/.test(String(offset)) || Number(limit) > 100 || Number(limit) < 1) return res.status(400).json({ error: 'Filtros inválidos.' });
  const items = [...playlistsDB.values()].filter(p => visible(p, req.userId) && (!userId || p.owner.id === userId) && `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase()));
  res.json({ data: items.slice(Number(offset), Number(offset) + Number(limit)), pagination: { total: items.length, limit: Number(limit), offset: Number(offset) } });
});
router.post('/', (req, res) => {
  const { name, description = '', tracks = [], public: isPublic = true } = req.body;
  if (typeof name !== 'string' || !name.trim() || typeof description !== 'string' || typeof isPublic !== 'boolean' || !validTracks(tracks)) return res.status(400).json({ error: 'Nome, visibilidade ou faixas inválidos.' });
  const user = usersDB.get(req.userId);
  const playlist = save({ id: randomUUID(), name: name.trim(), description, owner: { id: user.id, username: user.username, name: user.name }, tracks, public: isPublic, collaborative: false, createdAt: new Date().toISOString() });
  res.status(201).json({ data: playlist });
});
router.get('/:id', (req, res) => {
  const playlist = playlistsDB.get(req.params.id);
  if (!playlist || !visible(playlist, req.userId)) return res.status(404).json({ error: 'Playlist não encontrada.' });
  res.json({ data: playlist });
});
// Read ownership and apply each mutation inside the same write transaction.
function edit(req, res, callback) {
  const result = transaction(() => {
    const playlist = playlistsDB.get(req.params.id);
    if (!playlist) return { status: 404, body: { error: 'Playlist não encontrada.' } };
    if (playlist.owner.id !== req.userId) return { status: 403, body: { error: 'Somente o proprietário pode editar esta playlist.' } };
    return callback(playlist);
  });
  res.status(result.status || 200).json(result.body);
}
const invalid = error => ({ status: 400, body: { error } });
router.put('/:id', (req, res) => edit(req, res, playlist => {
  const { name, description, public: isPublic } = req.body;
  if ((name !== undefined && (typeof name !== 'string' || !name.trim())) || (description !== undefined && typeof description !== 'string') || (isPublic !== undefined && typeof isPublic !== 'boolean')) return invalid('Dados da playlist inválidos.');
  if (name !== undefined) playlist.name = name.trim();
  if (description !== undefined) playlist.description = description;
  if (isPublic !== undefined) playlist.public = isPublic;
  return { body: { data: save(playlist) } };
}));
router.delete('/:id', (req, res) => edit(req, res, playlist => {
  playlistsDB.delete(playlist.id);
  return { body: { success: true } };
}));
router.post('/:id/tracks', (req, res) => edit(req, res, playlist => {
  const { trackIds } = req.body;
  if (!validTracks(trackIds) || !trackIds.length) return invalid('Informe uma lista de faixas existentes.');
  playlist.tracks.push(...trackIds);
  return { body: { data: save(playlist) } };
}));
router.put('/:id/tracks/order', (req, res) => edit(req, res, playlist => {
  const { trackIds } = req.body;
  const current = playlist.tracks;
  if (!Array.isArray(trackIds) || trackIds.length !== current.length || new Set(trackIds).size !== current.length || !trackIds.every(id => typeof id === 'string' && current.includes(id))) return invalid('A ordem deve conter exatamente as faixas atuais, sem repetições.');
  playlist.tracks = trackIds;
  return { body: { data: save(playlist) } };
}));
router.delete('/:id/tracks/:trackId', (req, res) => edit(req, res, playlist => {
  if (!playlist.tracks.includes(req.params.trackId)) return { status: 404, body: { error: 'Faixa não encontrada na playlist.' } };
  playlist.tracks = playlist.tracks.filter(id => id !== req.params.trackId);
  return { body: { data: save(playlist) } };
}));
export default { router, playlistsDB };
