import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import TrackList from '../components/TrackList';
import Pagination from '../components/Pagination';
import usePage from '../hooks/usePage';

export default function ListeningHistory() {
  const { user, generation } = useAuth();
  const { play } = useOutletContext();
  const paging = usePage();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError('');
    if (user) api.get('/me/history', { params: { limit: paging.size, offset: paging.offset }, signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const last = Math.max(1, Math.ceil(data.pagination.total / paging.size));
        if (paging.page > last) paging.setPage(last, true);
        else setResult({ ...data, generation });
      }).catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.error || 'Não foi possível carregar o histórico.'); });
    return () => controller.abort();
  }, [user?.id, generation, paging.page, paging.size, revision]);
  async function clear() {
    setPending(true); setError('');
    try {
      await api.delete('/me/history');
      setRevision(value => value + 1);
    } catch (error) { setError(error.response?.data?.error || 'Não foi possível limpar o histórico.'); }
    finally { setPending(false); }
  }
  if (!user) return <section><h1>Histórico de escuta</h1><p><Link to="/auth/login">Entre para acessar seu histórico.</Link></p></section>;
  const current = result?.generation === generation ? result : null;
  return <section aria-label="Histórico de escuta"><h1>Histórico de escuta</h1>
    <p className="muted">Reproduções com pelo menos três segundos de áudio tocando. Mais recentes primeiro.</p>
    {error && <p role="alert">{error} <button onClick={() => setRevision(value => value + 1)}>Tentar novamente</button></p>}
    {!current ? !error && <p role="status">Carregando histórico…</p> : <>
      <button disabled={pending || !current.pagination.total} onClick={clear}>{pending ? 'Limpando…' : 'Limpar histórico'}</button>
      <TrackList tracks={current.data} itemKey={track => track.playbackId} offset={paging.offset} emptyMessage="Você ainda não tem reproduções no histórico." onPlay={track => play(track, [...new Map(current.data.map(item => [item.id, item])).values()])} renderActions={track => <time dateTime={track.playedAt}>{new Date(track.playedAt).toLocaleString('pt-BR')}</time>} />
      <Pagination page={paging.page} size={paging.size} total={current.pagination.total} onPage={paging.setPage} onSize={paging.setSize} />
    </>}
  </section>;
}
