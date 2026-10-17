import express from 'express';
import authMiddleware from '../../middleware/auth.js';
import { revokeUserSessions } from '../../data/sessions.js';
import { usersDB, publicUser } from '../../data/users.js';
import { PersistentMap, transaction } from '../../data/store.js';
import playlists from '../playlists/playlists.js';
const favorites = new PersistentMap('favorites');

const router = express.Router();
router.use(authMiddleware);
router.get('/', (req, res) => res.json({ data: [publicUser(usersDB.get(req.userId))] }));
router.use('/:id', (req, res, next) => req.params.id === req.userId ? next() : res.status(403).json({ error: 'Acesso restrito ao próprio perfil.' }));
router.get('/:id', (req, res) => res.json({ data: publicUser(usersDB.get(req.userId)) }));
router.put('/:id', (req, res) => {
  const { name, avatar, role } = req.body;
  if (role !== undefined) return res.status(403).json({ error: 'Não é permitido alterar o papel da conta.' });
  if ((name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 100)) || (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > 2048 || (avatar && !/^https?:\/\//i.test(avatar))))) return res.status(400).json({ error: 'Perfil inválido.' });
  const user = transaction(() => {
    const current = usersDB.get(req.userId);
    if (!current) throw Object.assign(new Error('Usuário não encontrado.'), { status: 401 });
    if (name !== undefined) current.name = name.trim();
    if (avatar !== undefined) current.avatar = avatar;
    usersDB.set(current.id, current);
    for (const playlist of playlists.playlistsDB.values()) {
      if (playlist.owner.id === current.id) {
        playlist.owner = { id: current.id, username: current.username, name: current.name, ...(current.avatar ? { avatar: current.avatar } : {}) };
        playlists.playlistsDB.set(playlist.id, playlist);
      }
    }
    return current;
  });
  res.json({ data: publicUser(user) });
});
router.delete('/:id', (req, res) => {
  transaction(() => {
    for (const playlist of playlists.playlistsDB.values()) if (playlist.owner.id === req.userId) playlists.playlistsDB.delete(playlist.id);
    favorites.delete(req.userId);
    revokeUserSessions(req.userId);
    usersDB.delete(req.userId);
  });
  res.json({ success: true });
});
export default { router, usersDB };
