export const mockArtists = [
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

export const mockAlbums = [
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

export const mockTracks = [
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
