import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Home, Search, Library, Heart, Clock, Shuffle, Repeat, Mic2, ListMusic, Info, MoreHorizontal } from 'lucide-react';
import PlaylistItem from '../PlaylistItem';
import ArtistItem from '../ArtistItem';
import './Sidebar.css';

function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [playlists, setPlaylists] = useState([
    { id: '1', name: 'Liked Songs', description: 'Liked songs', owner: { username: 'demo_user' }, public: true, trackCount: 1 },
    { id: '2', name: 'Chill Vibes', description: 'Relax and chill', owner: { username: 'demo_user' }, public: true, trackCount: 5 },
    { id: '3', name: 'Top Hits', description: 'The hottest tracks', owner: { username: 'demo_user' }, public: true, trackCount: 10 },
    { id: '4', name: 'Morning', description: 'Start your day right', owner: { username: 'demo_user' }, public: true, trackCount: 3 },
    { id: '5', name: 'Gym Pump', description: 'Workout motivation', owner: { username: 'demo_user' }, public: true, trackCount: 8 },
  ]);

  const [artists, setArtists] = useState([
    { id: '1', name: 'Artist 1', images: [{ url: 'https://placehold.co/640x640/1DB954/FFFFFF?text=A1' }], followers: 1000 },
    { id: '2', name: 'Artist 2', images: [{ url: 'https://placehold.co/640x640/4A90E2/FFFFFF?text=A2' }], followers: 2000 },
    { id: '3', name: 'Artist 3', images: [{ url: 'https://placehold.co/640x640/F5A623/FFFFFF?text=A3' }], followers: 1500 },
    { id: '4', name: 'Artist 4', images: [{ url: 'https://placehold.co/640x640/9B59B6/FFFFFF?text=A4' }], followers: 3000 },
    { id: '5', name: 'Artist 5', images: [{ url: 'https://placehold.co/640x640/E74C3C/FFFFFF?text=A5' }], followers: 5000 },
  ]);

  const [recentTracks] = useState([
    { id: '1', title: 'Track 1', artist: 'Artist 1', played: '2 min ago' },
    { id: '2', title: 'Track 2', artist: 'Artist 2', played: '1 hour ago' },
    { id: '3', title: 'Track 3', artist: 'Artist 3', played: '3 days ago' },
  ]);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [playlists, artists]);

  return (
    <aside className={`flex flex-col bg-[#0a0a0a] border-r border-[#282828] h-full`}>
      {/* Logo */}
      <div className="p-6">
        <img src="/spotify-logo.png" alt="Spotify" className="w-10 h-10" />
      </div>

      {/* Navigation */}
      <nav className="px-6 flex flex-col gap-4">
        <NavItem icon={Home} label="Home" active />
        <NavItem icon={Search} label="Search" />
        <NavItem icon={Library} label="Your Library" />
      </nav>

      {/* Library section */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button className="flex items-center gap-2 text-[#b3b3b3] hover:text-white transition-colors">
            <Plus size={20} />
            <span className="font-semibold">Playlists</span>
          </button>
          <button className="text-[#b3b3b3] hover:text-white transition-colors">
            <Plus size={16} />
          </button>
        </div>

        {/* Playlists */}
        <div className="flex flex-col gap-3 mb-6">
          {playlists.map(playlist => (
            <PlaylistItem key={playlist.id} playlist={playlist} />
          ))}
        </div>

        <div className="mb-6">
          <button
            className={`flex items-center justify-between w-full ${expanded ? 'text-white' : 'text-[#b3b3b3]'} hover:text-white transition-colors`}
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-2">
              <ChevronDown size={20} className={expanded ? 'rotate-180' : ''} />
              <span className="font-semibold">Your Episodes</span>
            </div>
            <MoreHorizontal size={16} />
          </button>
          <div className={`flex flex-col gap-3 mt-4 overflow-hidden ${!expanded && 'hidden'}`}>
            {recentTracks.map(track => (
              <div key={track.id} className="flex items-center gap-3 text-[#b3b3b3] hover:text-white hover:bg-white/10 px-2 -ml-2 rounded-md transition-colors cursor-pointer group">
                <div className="w-10 hover:bg-white/10 rounded p-1 group-hover:hidden" />
                <Clock size={16} className="hidden group-hover:block" />
                <span className="flex-1 truncate">{track.title}</span>
                <span className="text-xs opacity-60">{track.played}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Artists */}
        <div className="mb-6">
          <button
            className={`flex items-center justify-between w-full ${expanded ? 'text-white' : 'text-[#b3b3b3]'} hover:text-white transition-colors`}
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-2">
              <ChevronDown size={20} className={expanded ? 'rotate-180' : ''} />
              <span className="font-semibold">Artists</span>
            </div>
            <MoreHorizontal size={16} />
          </button>
          <div className={`flex flex-col gap-3 mt-4 overflow-hidden ${!expanded && 'hidden'}`}>
            {artists.map(artist => (
              <ArtistItem key={artist.id} artist={artist} />
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="scroll-ref" ref={scrollRef}>
          <button className="flex items-center gap-2 text-[#b3b3b3] hover:text-white transition-colors mb-4">
            <Heart size={20} />
            <span className="font-semibold">Liked Songs</span>
          </button>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-[#b3b3b3] hover:text-white hover:bg-white/10 px-2 -ml-2 rounded-md transition-colors cursor-pointer group">
              <div className="w-10 hover:bg-white/10 rounded p-1 group-hover:hidden" />
              <Clock size={16} className="hidden group-hover:block" />
              <span className="flex-1 truncate">Track 10</span>
              <span className="text-xs opacity-60">2 days ago</span>
            </div>
            <div className="flex items-center gap-3 text-[#b3b3b3] hover:text-white hover:bg-white/10 px-2 -ml-2 rounded-md transition-colors cursor-pointer group">
              <div className="w-10 hover:bg-white/10 rounded p-1 group-hover:hidden" />
              <Clock size={16} className="hidden group-hover:block" />
              <span className="flex-1 truncate">Track 11</span>
              <span className="text-xs opacity-60">5 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, active }) {
  return (
    <button className={`flex items-center gap-4 ${active ? 'text-white' : 'text-[#b3b3b3] hover:text-white'} transition-colors group`}>
      <div className={`p-2 rounded hover:bg-white/10 transition-colors ${active ? 'bg-white/20' : ''}`}>
        <Icon size={24} />
      </div>
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function PlaylistItem({ playlist }) {
  return (
    <button className="group flex items-center gap-3 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer">
      <div className="w-12 h-12 bg-[#333] rounded flex items-center justify-center relative">
        <span className="text-sm">{playlist.name[0]}</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <h4 className="font-medium truncate">{playlist.name}</h4>
        <p className="text-sm text-[#b3b3b3] group-hover:text-[#b3b3b3]">{playlist.owner.username}</p>
      </div>
      <span className="text-sm text-[#b3b3b3] hidden group-hover:block">{playlist.trackCount} songs</span>
    </button>
  );
}

function ArtistItem({ artist }) {
  return (
    <button className="group flex items-center gap-3 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer">
      <div className="w-12 h-12 bg-[#333] rounded overflow-hidden relative">
        <img src={artist.images[0]?.url} alt={artist.name} className="w-full h-full object-cover" />
        <div className="absolute right-2 bottom-12 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 bg-[#535353] rounded-full flex items-center justify-center hover:bg-[#1db954] transition-colors">
            <Play size={12} className="ml-1" />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <h4 className="font-medium truncate">{artist.name}</h4>
        <p className="text-sm text-[#b3b3b3] group-hover:text-white">{artist.followers} followers</p>
      </div>
    </button>
  );
}

export default Sidebar;
