import express from 'express';
import authMiddleware from '../../middleware/auth.js';
import { followStatus, setFollowing, followedArtists } from '../../data/follows.js';
import { parsePagination } from '../../utils/pagination.js';
const router = express.Router();
router.use(authMiddleware);
router.get('/', (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination) return res.status(400).json({ error: 'Paginação inválida.' });
  res.json(followedArtists(req.userId, pagination));
});
const action = callback => (req, res, next) => {
  try { res.json(callback(req)); }
  catch (error) { if (error.status) res.status(error.status).json({ error: error.message }); else next(error); }
};
router.get('/:artistId', action(req => followStatus(req.userId, req.params.artistId)));
router.put('/:artistId', action(req => setFollowing(req.userId, req.params.artistId, true)));
router.delete('/:artistId', action(req => setFollowing(req.userId, req.params.artistId, false)));
export default router;
