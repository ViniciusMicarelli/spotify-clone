// Real API and production UI with 121 tracks in isolated SQLite.
import express from 'express';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'spotify-pages-'));
const { default: api } = await import('../../api-gateway/index.js');
const { database, PersistentMap, transaction } = await import('../../data/store.js');
const { saveCatalog, catalogValues } = await import('../../data/catalog.js');
transaction(() => {
  if (process.env.AUDIO_FIXTURE === '1') {
    saveCatalog('tracks', { url: 'https://example.com/audio.mp3' }, '2');
    saveCatalog('tracks', { url: '/api/v1/audio/missing.wav' }, '3');
  }
  if (process.env.ALBUM_FIXTURE === '1') {
    saveCatalog('albums', { year: 2024, genres: ['Electronic', 'Instrumental'], images: [{ url: '/api/v1/images/album-demo.svg', width: 320, height: 320 }] }, '2');
    saveCatalog('albums', { images: [{ url: '/api/v1/images/missing.png' }] }, '3');
  }
  if (process.env.ARTIST_FIXTURE === '1') {
    saveCatalog('artists', { biography: 'Artista fictício de demonstração.\nTexto <b>literal</b>, sem HTML.', country: 'Brasil', images: [{ url: '/api/v1/images/artist-demo.svg', width: 320, height: 320 }] }, '1');
    saveCatalog('artists', { images: [{ url: '/api/v1/images/missing.png' }] }, '2');
    saveCatalog('artists', { images: [] }, '3');
  }
  if (process.env.SEARCH_FIXTURE === '1') {
    for (let i = 1; i <= 25; i++) {
      const name = `Busca exemplo ${String(i).padStart(2, '0')}`;
      const artist = saveCatalog('artists', { name, genres: ['Demo'] });
      saveCatalog('albums', { name, artists: [artist.id] });
    }
    saveCatalog('artists', { name: 'Árvore / %_?' });
  }
  for (let i = 1; i <= 118; i++) saveCatalog('tracks', { title: `Demo extra ${String(i).padStart(3,'0')}`, duration: 8000, artists: ['1'], albumId: '1', url: '/api/v1/audio/demo-1.wav' });
  const tracks = catalogValues('tracks').reverse();
  const ms = tracks.reduce((sum, track) => sum + track.duration, 0);
  new PersistentMap('playlists').set('pagination-fixture', { id: 'pagination-fixture', name: 'Playlist paginada', description: '121 faixas para validação', owner: { id: '1', username: 'demo_user', name: 'Demo User' }, public: false, collaborative: false, tracks: tracks.map(track => track.id), duration: { ms, formatted: `${Math.floor(ms / 60000)}:${String(ms / 1000 % 60).padStart(2,'0')}` } });
});
const app = express();
const dist = fileURLToPath(new URL('../../../frontend/web/dist/', import.meta.url));
app.use((req,res,next) => req.path.startsWith('/api/') ? api(req,res,next) : next());
app.use(express.static(dist));
app.get('*',(req,res) => res.sendFile(dist+'index.html'));
const server = app.listen(Number(process.env.PORT || 5175),'127.0.0.1',()=>console.log(`Pagination fixture: http://127.0.0.1:${server.address().port}`));
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>server.close(()=>{ database.close(); rmSync(process.env.DATA_DIR,{ recursive:true,force:true }); }));
