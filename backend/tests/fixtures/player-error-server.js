// Serves the production UI with one deliberately broken audio URL and one real demo.
// This fixture does not load or modify the application's persisted data.
import express from 'express';
import { fileURLToPath } from 'node:url';
const app = express();
const dist = fileURLToPath(new URL('../../../frontend/web/dist/', import.meta.url));
const audio = fileURLToPath(new URL('../../public/audio/', import.meta.url));
app.post('/api/v1/auth/refresh', (req, res) => res.status(401).json({ error: 'Guest fixture' }));
app.get('/api/v1/tracks', (req, res) => res.json({ data: [
  { id: 'broken', title: 'Áudio indisponível de teste', artists: ['1'], album: { id: '1', name: 'Teste de recuperação' }, duration: 1000, url: '/api/v1/audio/inexistente.wav' },
  { id: '2', title: 'Digital Dreams', artists: ['2'], album: { id: '2', name: 'Demonstração' }, duration: 10000, url: '/api/v1/audio/demo-2.wav' }
] }));
app.use('/api/v1/audio', express.static(audio, { fallthrough: false }));
app.use(express.static(dist));
app.get('*', (req, res) => res.sendFile(dist + 'index.html'));
app.use((error, req, res, next) => res.status(error.status || 500).end());
const server = app.listen(Number(process.env.PORT || 5175), '127.0.0.1', () => console.log(`Player error fixture: http://127.0.0.1:${server.address().port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close());
