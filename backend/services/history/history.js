import express from 'express';
import authMiddleware from '../../middleware/auth.js';
import { recordListen, clearHistory, listeningHistory } from '../../data/history.js';
import { parsePagination } from '../../utils/pagination.js';
const router = express.Router();
router.use(authMiddleware);
router.get('/', (req, res) => {
  const pagination = parsePagination(req.query);
  if (!pagination) return res.status(400).json({ error: 'Paginação inválida.' });
  res.json(listeningHistory(req.userId, pagination));
});
router.put('/:playbackId', (req, res, next) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.playbackId) || !req.body || typeof req.body.trackId !== 'string' || Object.keys(req.body).some(key => key !== 'trackId')) return res.status(400).json({ error: 'Reprodução inválida.' });
  try { res.json(recordListen(req.userId, req.params.playbackId, req.body.trackId)); }
  catch (error) { if (error.status) res.status(error.status).json({ error: error.message }); else next(error); }
});
router.delete('/', (req, res) => { clearHistory(req.userId); res.json({ success: true }); });
export default router;
