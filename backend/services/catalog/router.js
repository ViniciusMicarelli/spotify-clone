import express from 'express';
import authMiddleware from '../../middleware/auth.js';
import { getCatalog, catalogValues, saveCatalog, deleteCatalog, trackDetails } from '../../data/catalog.js';
const enrich = (kind, value) => kind !== 'tracks' ? value : trackDetails(value);
function routerFor(kind) {
  const router = express.Router();
  router.get('/', (req,res) => {
    const { limit = '50', offset = '0', search = '', artistId, albumId, genre } = req.query;
    const validNumber = value => typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
    if (!validNumber(limit) || Number(limit) < 1 || Number(limit) > 100 || !validNumber(offset) || [search, artistId, albumId, genre].some(value => value !== undefined && typeof value !== 'string')) return res.status(400).json({ error: 'Filtros ou paginação inválidos.' });
    const query = search.toLowerCase();
    const values = catalogValues(kind).filter(value => {
      const artistNames = kind === 'tracks' ? value.artists.map(id => getCatalog('artists',id).name).join(' ') : '';
      return `${value.name || value.title} ${artistNames} ${value.album?.name || ''}`.toLowerCase().includes(query) && (!artistId || value.artists?.includes(artistId)) && (!albumId || value.album?.id === albumId) && (!genre || value.genres?.includes(genre));
    });
    res.json({ data: values.slice(Number(offset),Number(offset)+Number(limit)).map(value => enrich(kind,value)), pagination: { limit: Number(limit), offset: Number(offset), total: values.length } });
  });
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
