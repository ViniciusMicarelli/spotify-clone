import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import TrackList from '../components/TrackList';
import TrackPicker from '../components/TrackPicker';
import Pagination from '../components/Pagination';
import usePage from '../hooks/usePage';

export default function Playlist() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { play } = useOutletContext();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const paging = usePage();
  const [tracks, setTracks] = useState([]);
  const [trackLoading, setTrackLoading] = useState(true);
  const [trackError, setTrackError] = useState('');
  const [total, setTotal] = useState(0);
  const [revision, setRevision] = useState(0);
  const [fields, setFields] = useState({ name: '', description: '', public: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setPlaylist(null); setError(''); setMessage('');
    async function load() {
      try {
        const detail = await api.get(`/playlists/${id}`, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setPlaylist(detail.data.data);
          setFields({ name: detail.data.data.name, description: detail.data.data.description, public: detail.data.data.public });
        }
      } catch (error) { if (!controller.signal.aborted) setError(error.response?.data?.error || 'Não foi possível carregar a playlist.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [id, token]);
  const owner = playlist && playlist.owner.id === user?.id;
  useEffect(() => {
    const controller = new AbortController(); setTrackLoading(true); setTrackError('');
    api.get(`/playlists/${id}/tracks`, { params: { limit: paging.size, offset: paging.offset }, signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      const last = Math.max(1, Math.ceil(data.pagination.total / paging.size));
      if (paging.page > last) { paging.setPage(last, true); return; }
      setTracks(data.data); setTotal(data.pagination.total); setTrackLoading(false);
    }).catch(error => { if (!controller.signal.aborted) { setTrackError(error.response?.data?.error || 'Não foi possível carregar as faixas.'); setTrackLoading(false); } });
    return () => controller.abort();
  }, [id, token, paging.page, paging.size, revision]);
  async function mutate(method, suffix, body, success) {
    setPending(true); setError(''); setMessage('');
    try {
      const { data } = await api.request({ url: `/playlists/${id}${suffix}`, method, data: body });
      if (method === 'delete' && !suffix) { navigate('/library'); return true; }
      setPlaylist(data.data); setMessage(success);
      setRevision(value => value + 1); return true;
    } catch (error) { setError(error.response?.data?.error || 'Não foi possível salvar a alteração.'); return false; }
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
  return <section><p className="eyebrow">PLAYLIST · {playlist.public ? 'PÚBLICA' : 'PRIVADA'}</p><h1>{playlist.name}</h1><p>{playlist.description}</p><p className="muted">Por {playlist.owner.name} · {playlist.tracks.length} faixas · {playlist.duration.formatted}</p>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {owner && <div className="playlist-editor">
      <form onSubmit={event => { event.preventDefault(); mutate('put', '', fields, 'Playlist salva.'); }}>
        <h2>Editar playlist</h2><label>Nome da playlist<input required value={fields.name} onChange={e => setFields({ ...fields, name: e.target.value })} /></label>
        <label>Descrição<textarea value={fields.description} onChange={e => setFields({ ...fields, description: e.target.value })} /></label>
        <label className="checkbox"><input type="checkbox" checked={fields.public} onChange={e => setFields({ ...fields, public: e.target.checked })} />Playlist pública</label>
        <button disabled={pending}>Salvar alterações</button>
      </form>
      <TrackPicker included={playlist.tracks} pending={pending} onAdd={id => mutate('post', '/tracks', { trackIds: [id] }, 'Faixa adicionada.')} />
    </div>}
    <div className="playlist-tracks">{trackError ? <p role="alert">{trackError}</p> : trackLoading ? <p role="status">Carregando faixas…</p> : <>
      <TrackList tracks={tracks} onPlay={play} offset={paging.offset} emptyMessage="Esta playlist ainda não tem músicas." renderActions={owner ? (track, index) => <>
        <div className="track-order"><button className="secondary" aria-label={`Subir ${track.title}`} disabled={pending || index === 0} onClick={() => move(track.id, -1)}>↑</button><button className="secondary" aria-label={`Descer ${track.title}`} disabled={pending || index === playlist.tracks.length - 1} onClick={() => move(track.id, 1)}>↓</button></div>
        <button className="secondary" disabled={pending} aria-label={`Remover ${track.title}`} onClick={() => mutate('delete', `/tracks/${track.id}`, undefined, 'Faixa removida.')}>Remover</button>
      </> : undefined} />
      <Pagination page={paging.page} size={paging.size} total={total} onPage={paging.setPage} onSize={paging.setSize} />
      {total > paging.size && <p className="muted">Ao ouvir, a fila usa as faixas desta página.</p>}
    </>}</div>
    {owner && <button className="danger" disabled={pending} onClick={() => mutate('delete', '', undefined, '')}>Excluir playlist</button>}
  </section>;
}
