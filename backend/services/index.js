import express from 'express';
import { auth } from './auth/index.js';
import usersData from './users/users.js';
import tracksData from './tracks/tracks.js';
import albumsData from './albums/albums.js';
import artistsData from './artists/artists.js';
import playlistsData from './playlists/playlists.js';
import authMiddleware from '../middleware/auth.js';

// Adapt the existing route descriptors to routers mounted at /api/v1/<resource>.
function routerFor(resource, routes) {
  const router = express.Router();
  for (const route of routes) {
    const path = route.path.slice(resource.length + 1) || '/';
    const middleware = route.method === 'GET' ? [] : [authMiddleware, (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Somente administradores podem alterar o catálogo.' })];
    router[route.method.toLowerCase()](path, ...middleware, async (req, res, next) => {
      try {
        const result = await route.handler(req);
        // Legacy user descriptors must never return stored credentials.
        if (resource === 'users' && result.data) {
          const sanitize = ({ password, ...user }) => user;
          result.data = Array.isArray(result.data) ? result.data.map(sanitize) : sanitize(result.data);
        }
        const status = result.error ? (/not found/i.test(result.error) ? 404 : 400) : 200;
        res.status(status).json(result);
      } catch (error) { next(error); }
    });
  }
  return router;
}
export { auth };
export const users = usersData.router;
export const tracks = routerFor('tracks', tracksData.tracksRoutes);
export const albums = routerFor('albums', albumsData.albumsRoutes);
export const artists = routerFor('artists', artistsData.artistsRoutes);
export const playlists = playlistsData.router;
