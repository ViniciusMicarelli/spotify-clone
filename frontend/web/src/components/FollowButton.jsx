import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';

export default function FollowButton({ artist }) {
  const { user, generation } = useAuth();
  const [state, setState] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState(null);
    if (user) api.get(`/me/followed-artists/${artist.id}`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setState({ ...data, artistId: artist.id, generation }); })
      .catch(error => { if (!controller.signal.aborted) setState({ artistId: artist.id, generation, error: error.response?.data?.error || 'Não foi possível carregar o artista.' }); });
    return () => controller.abort();
  }, [artist.id, user?.id, generation, revision]);
  const current = state?.artistId === artist.id && state.generation === generation ? state : null;
  async function toggle() {
    if (!current || current.pending || current.error) return;
    setState({ ...current, pending: true });
    try {
      const { data } = await api.request({ method: current.following ? 'delete' : 'put', url: `/me/followed-artists/${artist.id}` });
      setState(previous => previous?.artistId === artist.id && previous.generation === generation ? { ...previous, ...data, pending: false } : previous);
    } catch (error) {
      setState(previous => previous?.artistId === artist.id && previous.generation === generation ? { ...previous, pending: false, error: error.response?.data?.error || 'Não foi possível atualizar o artista.' } : previous);
    }
  }
  if (!user) return <p><Link to="/auth/login">Entre para seguir {artist.name}</Link></p>;
  return <div className="artist-follow">
    <button aria-pressed={Boolean(current?.following)} disabled={!current || current.pending || Boolean(current.error)} onClick={toggle}>{current?.following ? 'Deixar de seguir' : 'Seguir'} {artist.name}</button>
    {current && !current.error && <p className="muted">{current.followers} seguidores</p>}
    {current?.error && <p role="alert">{current.error} <button onClick={() => setRevision(value => value + 1)}>Tentar novamente</button></p>}
  </div>;
}
