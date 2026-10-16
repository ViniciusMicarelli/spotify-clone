import { PersistentMap } from '../../data/store.js';
import albums from '../albums/albums.js';
const { albumsDB } = albums;
// Mock artist data for demo
const mockArtists = [
  {
    id: '1',
    name: 'Artist 1',
    images: [{ url: 'https://placehold.co/640x640/1DB954/FFFFFF?text=A1', height: 640, width: 640 }],
    followers: 1000,
    genres: ['Electronic', 'Pop'],
    external_urls: { spotify: 'https://open.spotify.com/artist/1' }
  },
  {
    id: '2',
    name: 'Artist 2',
    images: [{ url: 'https://placehold.co/640x640/4A90E2/FFFFFF?text=A2', height: 640, width: 640 }],
    followers: 2000,
    genres: ['Rock', 'Indie'],
    external_urls: { spotify: 'https://open.spotify.com/artist/2' }
  },
  {
    id: '3',
    name: 'Artist 3',
    images: [{ url: 'https://placehold.co/640x640/F5A623/FFFFFF?text=A3', height: 640, width: 640 }],
    followers: 1500,
    genres: ['Pop', 'Dance'],
    external_urls: { spotify: 'https://open.spotify.com/artist/3' }
  }
];

// Persistent local store; mock records seed only the first run.
const artistsDB = new PersistentMap('artists', mockArtists.map(item => [item.id, item]));

// Existing records are preserved across restarts.


// Routes
export const artistsRoutes = [
  {
    method: 'GET',
    path: '/artists',
    handler: async (req) => {
      const { limit = 50, offset = 0, search, genre } = req.query;

      let artists = Array.from(artistsDB.values());

      if (search) {
        artists = artists.filter(a =>
          a.name?.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (genre) {
        artists = artists.filter(a => a.genres?.includes(genre));
      }

      const result = artists.slice(Number(offset), Number(offset) + Number(limit));

      return {
        data: result,
        pagination: { limit: Number(limit), offset: Number(offset), total: artists.length }
      };
    }
  },
  {
    method: 'POST',
    path: '/artists',
    handler: async (req) => {
      const { name, images, genres, followers } = req.body;

      if (!name) {
        return { error: 'Artist name is required' };
      }

      const artist = {
        id: Date.now().toString(),
        name,
        images: images || [{ url: `https://placehold.co/640x640/1DB954/FFFFFF?text=${encodeURIComponent(name)}`, height: 640, width: 640 }],
        followers: followers || 0,
        genres: genres || [],
        external_urls: { spotify: `https://open.spotify.com/artist/${Date.now()}` },
        createdAt: new Date().toISOString()
      };

      artistsDB.set(artist.id, artist);

      return { data: { id: artist.id, ...artist } };
    }
  },
  {
    method: 'GET',
    path: '/artists/:id',
    handler: async (req) => {
      const { id } = req.params;
      const artist = artistsDB.get(id);

      if (!artist) {
        return { error: 'Artist not found' };
      }

      return { data: artist };
    }
  },
  {
    method: 'PUT',
    path: '/artists/:id',
    handler: async (req) => {
      const { id } = req.params;
      const { name, images, genres, followers } = req.body;
      const artist = artistsDB.get(id);

      if (!artist) {
        return { error: 'Artist not found' };
      }

      if (name) artist.name = name;
      if (images !== undefined) artist.images = images;
      if (genres !== undefined) artist.genres = genres;
      if (followers !== undefined) artist.followers = followers;

      artistsDB.set(id, artist);

      return { data: { id: artist.id, ...artist } };
    }
  },
  {
    method: 'DELETE',
    path: '/artists/:id',
    handler: async (req) => {
      const { id } = req.params;

      if (!artistsDB.has(id)) {
        return { error: 'Artist not found' };
      }

      // Remove artist from all albums
      albumsDB.forEach(album => {
        const newArtists = album.artists.filter(aId => aId !== id);
        albumsDB.set(album.id, { ...album, artists: newArtists });
      });

      artistsDB.delete(id);

      return { success: true, message: 'Artist deleted' };
    }
  }
];

export default { mockArtists, artistsDB, artistsRoutes };
