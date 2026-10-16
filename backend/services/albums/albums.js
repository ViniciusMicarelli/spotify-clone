import { PersistentMap } from '../../data/store.js';
import tracks from '../tracks/tracks.js';
const { tracksDB } = tracks;
// Mock album data for demo
const mockAlbums = [
  {
    id: '1',
    name: 'Lifestyle',
    artists: ['1'],
    totalTracks: 1,
    images: [{ url: 'https://placehold.co/640x640/1DB954/FFFFFF?text=Lifestyle', height: 640, width: 640 }],
    uri: 'spotify:album:1'
  },
  {
    id: '2',
    name: 'Digital Dreams',
    artists: ['2'],
    totalTracks: 1,
    images: [{ url: 'https://placehold.co/640x640/4A90E2/FFFFFF?text=Digital', height: 640, width: 640 }],
    uri: 'spotify:album:2'
  },
  {
    id: '3',
    name: 'Summer Vibes',
    artists: ['3'],
    totalTracks: 1,
    images: [{ url: 'https://placehold.co/640x640/F5A623/FFFFFF?text=Summer', height: 640, width: 640 }],
    uri: 'spotify:album:3'
  }
];

// Persistent local store; mock records seed only the first run.
const albumsDB = new PersistentMap('albums', mockAlbums.map(item => [item.id, item]));

// Existing records are preserved across restarts.


// Routes
export const albumsRoutes = [
  {
    method: 'GET',
    path: '/albums',
    handler: async (req) => {
      const { limit = 50, offset = 0, search, artistId } = req.query;

      let albums = Array.from(albumsDB.values());

      if (search) {
        albums = albums.filter(a =>
          a.name?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (artistId) {
        albums = albums.filter(a => a.artists.includes(artistId));
      }

      const result = albums.slice(Number(offset), Number(offset) + Number(limit));

      return {
        data: result,
        pagination: { limit: Number(limit), offset: Number(offset), total: albums.length }
      };
    }
  },
  {
    method: 'POST',
    path: '/albums',
    handler: async (req) => {
      const { name, artists, tracks, images } = req.body;

      if (!name) {
        return { error: 'Album name is required' };
      }

      const album = {
        id: Date.now().toString(),
        name,
        artists: artists || [],
        totalTracks: tracks?.length || 0,
        images: images || [{ url: `https://placehold.co/640x640/1DB954/FFFFFF?text=${encodeURIComponent(name)}`, height: 640, width: 640 }],
        uri: `spotify:album:${Date.now()}`,
        createdAt: new Date().toISOString()
      };

      albumsDB.set(album.id, album);

      return { data: { id: album.id, ...album } };
    }
  },
  {
    method: 'GET',
    path: '/albums/:id',
    handler: async (req) => {
      const { id } = req.params;
      const album = albumsDB.get(id);

      if (!album) {
        return { error: 'Album not found' };
      }

      return { data: album };
    }
  },
  {
    method: 'PUT',
    path: '/albums/:id',
    handler: async (req) => {
      const { id } = req.params;
      const { name, artists, tracks, images } = req.body;
      const album = albumsDB.get(id);

      if (!album) {
        return { error: 'Album not found' };
      }

      if (name) album.name = name;
      if (artists !== undefined) album.artists = artists;
      if (tracks !== undefined) {
        album.totalTracks = tracks.length;
        // Add tracks to album
        tracks.forEach(trackId => {
          if (!album.tracks) album.tracks = [];
          album.tracks.push(trackId);
        });
      }
      if (images) album.images = images;

      albumsDB.set(id, album);

      return { data: { id: album.id, ...album } };
    }
  },
  {
    method: 'DELETE',
    path: '/albums/:id',
    handler: async (req) => {
      const { id } = req.params;

      if (!albumsDB.has(id)) {
        return { error: 'Album not found' };
      }

      // Also remove from tracks
      const album = albumsDB.get(id);
      if (album.tracks) {
        album.tracks.forEach(trackId => {
          const track = tracksDB.get(trackId);
          if (track) {
            const trackIndex = track.album?.id === id ? track.trackNumber - 1 : null;
            if (trackIndex !== null) {
              track.trackNumber = trackIndex + 1;
              if (tracksDB.has(track.id)) {
                tracksDB.set(track.id, track);
              }
            }
          }
        });
      }

      albumsDB.delete(id);

      return { success: true, message: 'Album deleted' };
    }
  }
];

export default { mockAlbums, albumsDB, albumsRoutes };
