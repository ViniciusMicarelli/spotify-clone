import express from 'express';
import { database } from '../../data/store.js';
import { audioWaveform } from '../../data/audio-metadata.js';
import authMiddleware from '../../middleware/auth.js';
import { getCatalog, listCatalog, saveCatalog, deleteCatalog, trackDetails } from '../../data/catalog.js';
import { parsePagination } from '../../utils/pagination.js';
const enrich = (kind, value) => kind !== 'tracks' ? value : trackDetails(value);
function routerFor(kind) {
  const router = express.Router();
  router.get('/', (req,res) => {
    const { search = '', artistId, albumId, genre } = req.query;
    const pagination = parsePagination(req.query);
    if (!pagination || [search, artistId, albumId, genre].some(value => value !== undefined && typeof value !== 'string')) return res.status(400).json({ error: 'Filtros ou paginação inválidos.' });
    res.json(listCatalog(kind, { ...pagination, search, artistId, albumId, genre }));
  });
  if (kind === 'tracks') router.get('/:id/waveform', (req, res) => {
    const track = getCatalog('tracks', req.params.id);
    if (!track) return res.status(404).json({ error: 'Faixa não encontrada.' });
    res.json({ data: audioWaveform(track.url) });
  });
  if (kind === 'artists') router.get('/genres', (req, res) => res.json({ data: database.prepare('SELECT DISTINCT genre FROM catalog_artist_genres ORDER BY genre').all().map(row => row.genre) }));
  router.get('/:id',(req,res) => {
    const value = getCatalog(kind,req.params.id);
    if (!value) return res.status(404).json({ error: 'Registro não encontrado.' });
    res.json({ data: enrich(kind,value) });
  });
  router.use(authMiddleware, (req,res,next) => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Somente administradores podem alterar o catálogo.' }));
  const mutation = (callback, status) => (req,res,next) => {
    try { const data = callback(req); res.status(status).json(data ? { data: enrich(kind,data) } : { success: true }); }
    catch (error) { if (error.status) return res.status(error.status).json({ error: error.message }); next(error); }
  };
  router.post('/',mutation(req => saveCatalog(kind,req.body),201));
  router.put('/:id',mutation(req => saveCatalog(kind,req.body,req.params.id),200));
  router.delete('/:id',mutation(req => deleteCatalog(kind,req.params.id),200));
  return router;
}
export const tracks = routerFor('tracks');
export const albums = routerFor('albums');
export const artists = routerFor('artists');
