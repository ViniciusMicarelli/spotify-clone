import { useEffect } from 'react';
import { useAuthStore } from './context/AuthContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Catalog from './pages/Catalog';
import CreatePlaylist from './pages/CreatePlaylist';
import Playlist from './pages/Playlist';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Library from './pages/Library';
import ListeningHistory from './pages/ListeningHistory';

export default function App() {
  const ready = useAuthStore(state => state.ready);
  useEffect(() => { useAuthStore.getState().initialize(); }, []);
  if (!ready) return <p role="status">Recuperando sessão…</p>;
  return <Routes>
    <Route element={<Layout />}>
      <Route index element={<Catalog kind="tracks" />} />
      <Route path="search/:query?" element={<Catalog kind="tracks" search />} />
      <Route path="profile" element={<Profile />} />
      <Route path="liked-songs" element={<Favorites />} />
      <Route path="history" element={<ListeningHistory />} />
      <Route path="library" element={<Library />} />
      <Route path="artist/:id" element={<Catalog kind="artists" />} />
      <Route path="album/:id" element={<Catalog kind="albums" />} />
      <Route path="playlist/:id" element={<Playlist />} />
      <Route path="track/:id" element={<Catalog kind="tracks" />} />
      <Route path="create-playlist" element={<CreatePlaylist />} />
    </Route>
    <Route path="auth/login" element={<Login />} />
    <Route path="auth/signup" element={<Signup />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
