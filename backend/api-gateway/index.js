import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import follows from '../services/follows/follows.js';
import favorites from '../services/favorites/favorites.js';
import { auth, users, tracks, albums, artists, playlists } from '../services/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route for auth service
app.use('/api/v1/auth', auth);
app.use('/api/v1/audio', express.static(fileURLToPath(new URL('../public/audio/', import.meta.url)), { fallthrough: false }));

// Routes for data services
app.use('/api/v1/users', users);
app.use('/api/v1/tracks', tracks);
app.use('/api/v1/albums', albums);
app.use('/api/v1/artists', artists);
app.use('/api/v1/playlists', playlists);
app.use('/api/v1/me/liked-tracks', favorites);
app.use('/api/v1/me/followed-artists', follows);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API version info
app.get('/api/v1', (req, res) => {
  res.json({
    version: '1.0.0',
    services: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      tracks: '/api/v1/tracks',
      albums: '/api/v1/albums',
      artists: '/api/v1/artists',
      playlists: '/api/v1/playlists',
      favorites: '/api/v1/me/liked-tracks',
      following: '/api/v1/me/followed-artists'
    }
  });
});

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.status === 400 ? 'JSON inválido.' : 'Erro interno do servidor.' });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = app.listen(PORT, () => console.log(`API disponível na porta ${server.address().port}`));
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close());
}
export { app };
export default app;
