// Production UI + real API, isolated SQLite and a two-second access token.
import express from 'express';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'spotify-session-browser-'));
process.env.ACCESS_TOKEN_TTL_SECONDS = '2';
const { default: api } = await import('../../api-gateway/index.js');
const { database } = await import('../../data/store.js');
const app = express();
const dist = fileURLToPath(new URL('../../../frontend/web/dist/', import.meta.url));
// Deliver the first access token after expiry to exercise simultaneous 401 recovery.
app.post('/api/v1/auth/signin', (req, res, next) => {
  const send = res.json.bind(res);
  res.json = body => { setTimeout(() => send(body), 3000); return res; };
  next();
});
app.use((req, res, next) => req.path.startsWith('/api/') ? api(req, res, next) : next());
app.use(express.static(dist));
app.get('*', (req, res) => res.sendFile(dist + 'index.html'));
const server = app.listen(Number(process.env.PORT || 5175), '127.0.0.1', () => console.log(`Session fixture: http://127.0.0.1:${server.address().port}`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => { database.close(); rmSync(process.env.DATA_DIR, { recursive: true, force: true }); }));
