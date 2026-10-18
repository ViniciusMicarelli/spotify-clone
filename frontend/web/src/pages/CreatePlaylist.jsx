import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
export default function CreatePlaylist() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event) {
    event.preventDefault(); setPending(true); setError('');
    try { const { data } = await api.post('/playlists', { name }); navigate(`/playlist/${data.data.id}`); }
    catch (error) { setError(error.response?.data?.error || 'Não foi possível criar a playlist.'); }
    finally { setPending(false); }
  }
  return <section><h1>Criar playlist</h1>{isAuthenticated ? <form onSubmit={submit}><label>Nome<input required value={name} onChange={event => setName(event.target.value)} /></label><button disabled={pending}>Criar</button></form> : <p><Link to="/auth/login">Entre para criar uma playlist.</Link></p>}{error && <p role="alert">{error}</p>}</section>;
}
