import { PersistentMap } from '../../data/store.js';
// Mock track data for demo
const mockTracks = [
  {
    id: '1',
    title: 'Lifestyle',
    duration: 8000,
    artists: ['1'],
    album: { id: '1', name: 'Lifestyle', uri: 'spotify:album:1' },
    uri: 'spotify:track:1',
    url: '/api/v1/audio/demo-1.wav'
  },
  {
    id: '2',
    title: 'Digital Dreams',
    duration: 10000,
    artists: ['2'],
    album: { id: '2', name: 'Digital Dreams', uri: 'spotify:album:2' },
    uri: 'spotify:track:2',
    url: '/api/v1/audio/demo-2.wav'
  },
  {
    id: '3',
    title: 'Summer Vibes',
    duration: 12000,
    artists: ['3'],
    album: { id: '3', name: 'Summer Vibes', uri: 'spotify:album:3' },
    uri: 'spotify:track:3',
    url: '/api/v1/audio/demo-3.wav'
  }
];

// Persistent local store; mock records seed only the first run.
const tracksDB = new PersistentMap('tracks', mockTracks.map(item => [item.id, item]));

// Migrate only the original demo sources; user-provided URLs stay untouched.
for (const seed of mockTracks) {
  const existing = tracksDB.get(seed.id);
  if (existing?.url === `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${seed.id}.mp3`) {
    tracksDB.set(seed.id, { ...existing, url: seed.url, duration: seed.duration });
  }
}


// Routes
export const tracksRoutes = [
  {
    method: 'GET',
    path: '/tracks',
    handler: async (req) => {
      const { limit = 50, offset = 0, search, artistId, albumId } = req.query;

      let tracks = Array.from(tracksDB.values());

      if (search) {
        tracks = tracks.filter(t =>
          t.title?.toLowerCase().includes(search.toLowerCase()) ||
          t.artists.some(a => a.name?.toLowerCase().includes(search.toLowerCase()))
        );
      }

      if (artistId) {
        tracks = tracks.filter(t => t.artists.includes(artistId));
      }

      if (albumId) {
        tracks = tracks.filter(t => t.album.id === albumId);
      }

      const result = tracks.slice(Number(offset), Number(offset) + Number(limit));

      return {
        data: result,
        pagination: { limit: Number(limit), offset: Number(offset), total: tracks.length }
      };
    }
  },
  {
    method: 'POST',
    path: '/tracks',
    handler: async (req) => {
      const { title, duration, artists, album, url } = req.body;

      if (!title || !url) {
        return { error: 'Title and URL are required' };
      }

      const track = {
        id: Date.now().toString(),
        title,
        duration: duration || 187000,
        artists: artists || [],
        album: album || { id: Date.now().toString(), name: title, uri: `spotify:album:${Date.now()}` },
        uri: `spotify:track:${Date.now()}`,
        url,
        addedAt: new Date().toISOString(),
        duration_formatted: `${(duration / 60000).toFixed(2)}:00`
      };

      tracksDB.set(track.id, track);

      return { data: { id: track.id, ...track } };
    }
  },
  {
    method: 'GET',
    path: '/tracks/:id',
    handler: async (req) => {
      const { id } = req.params;
      const track = tracksDB.get(id);

      if (!track) {
        return { error: 'Track not found' };
      }

      return { data: track };
    }
  },
  {
    method: 'PUT',
    path: '/tracks/:id',
    handler: async (req) => {
      const { id } = req.params;
      const { title, duration, artists, album, url } = req.body;
      const track = tracksDB.get(id);

      if (!track) {
        return { error: 'Track not found' };
      }

      if (title) track.title = title;
      if (duration !== undefined) {
        track.duration = duration;
        track.duration_formatted = `${(duration / 60000).toFixed(2)}:00`;
      }
      if (artists) track.artists = artists;
      if (album) {
        track.album = album;
        track.album_uri = `spotify:album:${album.id}`;
      }
      if (url) track.url = url;

      tracksDB.set(id, track);

      return { data: { id: track.id, ...track } };
    }
  },
  {
    method: 'DELETE',
    path: '/tracks/:id',
    handler: async (req) => {
      const { id } = req.params;

      if (!tracksDB.has(id)) {
        return { error: 'Track not found' };
      }

      tracksDB.delete(id);

      return { success: true, message: 'Track deleted' };
    }
  }
];

export default { mockTracks, tracksDB, tracksRoutes };
