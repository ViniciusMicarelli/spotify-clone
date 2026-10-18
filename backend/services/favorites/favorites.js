import express from 'express';
import authMiddleware from '../../middleware/auth.js';
import { PersistentMap, transaction } from '../../data/store.js';
import tracks from '../tracks/tracks.js';
import { trackDetails } from '../../data/catalog.js';

const favoritesDB = new PersistentMap('favorites');
const router = express.Router();
router.use(authMiddleware);
function result(userId) {
  const ids = (favoritesDB.get(userId) || []).filter(id => tracks.tracksDB.has(id));
  return { trackIds: ids, data: ids.map(id => trackDetails(tracks.tracksDB.get(id))) };
}
router.get('/', (req, res) => res.json(result(req.userId)));
router.put('/:trackId', (req, res) => {
  const { trackId } = req.params;
  if (!tracks.tracksDB.has(trackId)) return res.status(404).json({ error: 'Faixa não encontrada.' });
  const response = transaction(() => {
    const ids = favoritesDB.get(req.userId) || [];
    if (!ids.includes(trackId)) favoritesDB.set(req.userId, [...ids, trackId]);
    return result(req.userId);
  });
  res.json(response);
});
router.delete('/:trackId', (req, res) => {
  const response = transaction(() => {
    const ids = favoritesDB.get(req.userId) || [];
    if (ids.includes(req.params.trackId)) favoritesDB.set(req.userId, ids.filter(id => id !== req.params.trackId));
    return result(req.userId);
  });
  res.json(response);
});
export default router;
