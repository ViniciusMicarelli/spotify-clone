import { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Home, Search, Library, Plus, ChevronDown, Volume2, Maximize2, Mic2, ChevronLeft, ChevronRight, ListMusic, Shuffle, Repeat, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UserMenu from './UserMenu';

function TopBar() {
  const { user } = useAuth();
  const [volume, setVolume] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#000000] flex items-center justify-between px-4 z-50">
      {/* Left section - Logo and user */}
      <div className="flex items-center gap-4 w-1/4">
        <img src="/spotify-logo.png" alt="Spotify" className="w-8 h-8" />
        <div className="flex items-center relative">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Home">
            <Home size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Search">
            <Search size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Your Library">
            <Library size={20} />
          </button>
        </div>
      </div>

      {/* Center section - Navigation */}
      <div className="flex items-center gap-1 w-2/4">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block" title="Home">
          <Home size={22} />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Search">
          <Search size={20} />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Your Library">
          <Library size={20} />
        </button>
      </div>

      {/* Right section - Controls */}
      <div className="flex items-center justify-end gap-2 w-1/4">
        <UserMenu user={user} />

        {/* Center controls */}
        <button className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors text-[#b3b3b3]">
          <Mic2 size={16} />
        </button>
        <button className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors text-[#b3b3b3]">
          <ListMusic size={16} />
        </button>
        <button className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors text-[#b3b3b3]">
          <Category size={16} />
        </button>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#b3b3b3]">
            <ChevronLeft size={20} />
          </button>
          <button
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${isPlaying ? 'bg-white' : 'bg-[#535353] hover:bg-[#6e6e6e]'}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#b3b3b3]">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => setVolume(v => Math.max(0, v - 10))} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#b3b3b3]">
            <Volume2 size={16} />
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-24 h-1 bg-[#484848] rounded-full appearance-none cursor-pointer"
          />
          <button onClick={() => setVolume(v => Math.min(100, v + 10))} className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#b3b3b3]">
            <Volume2 size={16} />
          </button>
        </div>

        <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#b3b3b3]">
          <Maximize2 size={16} />
        </button>
      </div>
    </header>
  );
}

function UserMenu({ user }) {
  return (
    <div className="relative flex items-center">
      <button className="flex items-center gap-2 hover:bg-white/10 rounded-full p-1 transition-colors">
        <img
          src={user?.avatar}
          alt={user?.name}
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="text-sm font-medium">{user?.username}</span>
        <button className="text-[#b3b3b3] hover:text-white">
          <ChevronDown size={16} />
        </button>
      </button>

      {/* Dropdown menu */}
      <div className="absolute top-14 right-0 w-48 bg-[#282828] rounded-lg shadow-lg hidden group-hover:block p-2">
        <button className="w-full text-left px-4 py-2 hover:bg-[#3a3a3a] rounded transition-colors">
          Account
        </button>
        <button className="w-full text-left px-4 py-2 hover:bg-[#3a3a3a] rounded transition-colors">
          Premium
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('spotify-clone-token');
            window.location.href = '/auth/login';
          }}
          className="w-full text-left px-4 py-2 hover:bg-[#3a3a3a] rounded transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default TopBar;
