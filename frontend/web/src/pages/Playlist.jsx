import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import FavoriteButton from '../components/FavoriteButton';

export default function Playlist() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { play } = useOutletContext();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [fields, setFields] = useState({ name: '', description: '', public: true });
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setPlaylist(null); setError(''); setMessage(''); setSelected('');
    async function load() {
      try {
        const [detail, tracks] = await Promise.all([
          api.get(`/playlists/${id}`, { signal: controller.signal }),
          api.get('/tracks', { params: { limit: 100 }, signal: controller.signal })
        ]);
        if (!controller.signal.aborted) {
          setPlaylist(detail.data.data); setCatalog(tracks.data.data);
          setFields({ name: detail.data.data.name, description: detail.data.data.description, public: detail.data.data.public });
        }
      } catch (error) { if (!controller.signal.aborted) setError(error.response?.data?.error || 'Não foi possível carregar a playlist.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [id, token]);
  const owner = playlist && playlist.owner.id === user?.id;
  const tracks = (playlist?.tracks || []).map(id => catalog.find(track => track.id === id)).filter(Boolean);
  const available = catalog.filter(track => !playlist?.tracks.includes(track.id));
  async function mutate(method, suffix, body, success) {
    setPending(true); setError(''); setMessage('');
    try {
      const { data } = await api.request({ url: `/playlists/${id}${suffix}`, method, data: body });
      if (method === 'delete' && !suffix) { navigate('/library'); return; }
      setPlaylist(data.data); setMessage(success);
      if (method === 'post') setSelected('');
    } catch (error) { setError(error.response?.data?.error || 'Não foi possível salvar a alteração.'); }
    finally { setPending(false); }
  }
  function move(trackId, direction) {
    const trackIds = [...playlist.tracks];
    const index = trackIds.indexOf(trackId);
    const target = index + direction;
    if (pending || index < 0 || target < 0 || target >= trackIds.length) return;
    [trackIds[index], trackIds[target]] = [trackIds[target], trackIds[index]];
    mutate('put', '/tracks/order', { trackIds }, 'Ordem salva.');
  }
  if (loading) return <p role="status">Carregando playlist…</p>;
  if (!playlist) return <p role="alert">{error}</p>;
  return <section><p className="eyebrow">PLAYLIST · {playlist.public ? 'PÚBLICA' : 'PRIVADA'}</p><h1>{playlist.name}</h1><p>{playlist.description}</p><p className="muted">Por {playlist.owner.name} · {tracks.length} faixas · {playlist.duration.formatted}</p>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {owner && <div className="playlist-editor">
      <form onSubmit={event => { event.preventDefault(); mutate('put', '', fields, 'Playlist salva.'); }}>
        <h2>Editar playlist</h2><label>Nome da playlist<input required value={fields.name} onChange={e => setFields({ ...fields, name: e.target.value })} /></label>
        <label>Descrição<textarea value={fields.description} onChange={e => setFields({ ...fields, description: e.target.value })} /></label>
        <label className="checkbox"><input type="checkbox" checked={fields.public} onChange={e => setFields({ ...fields, public: e.target.checked })} />Playlist pública</label>
        <button disabled={pending}>Salvar alterações</button>
      </form>
      <form onSubmit={event => { event.preventDefault(); mutate('post', '/tracks', { trackIds: [selected] }, 'Faixa adicionada.'); }}>
        <h2>Adicionar música</h2><label>Faixa<select required value={selected} onChange={e => setSelected(e.target.value)}><option value="">Selecione uma faixa</option>{available.map(track => <option key={track.id} value={track.id}>{track.title}</option>)}</select></label>
        <button disabled={pending || !selected}>Adicionar faixa</button>{!available.length && <p className="muted">Todas as faixas do catálogo já estão nesta playlist.</p>}
      </form>
    </div>}
    <div className="track-list">{tracks.map((track, index) => <article key={track.id} data-track-id={track.id}><span>{index + 1}</span><div><Link to={`/track/${track.id}`}><strong>{track.title}</strong></Link><p className="muted">{track.album.name}</p></div><button onClick={() => play(track, tracks)}>Ouvir</button><FavoriteButton track={track} />{owner && <div className="track-order"><button className="secondary" aria-label={`Subir ${track.title}`} disabled={pending || index === 0} onClick={() => move(track.id, -1)}>↑</button><button className="secondary" aria-label={`Descer ${track.title}`} disabled={pending || index === tracks.length - 1} onClick={() => move(track.id, 1)}>↓</button></div>}{owner && <button className="secondary" disabled={pending} aria-label={`Remover ${track.title}`} onClick={() => mutate('delete', `/tracks/${track.id}`, undefined, 'Faixa removida.')}>Remover</button>}</article>)}</div>
    {!tracks.length && <p>Esta playlist ainda não tem músicas.</p>}
    {owner && <button className="danger" disabled={pending} onClick={() => mutate('delete', '', undefined, '')}>Excluir playlist</button>}
  </section>;
}
