import { Link, useOutletContext } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import TrackList from '../components/TrackList';
import Pagination from '../components/Pagination';
import usePage from '../hooks/usePage';
export default function Favorites() {
  const { tracks, authenticated, loading, error } = useFavorites();
  const { play } = useOutletContext();
  const paging = usePage(loading || error ? undefined : tracks.length);
  return <section><p className="eyebrow">SUA COLEÇÃO</p><h1>Músicas curtidas</h1>
    {!authenticated ? <p><Link to="/auth/login">Entre para acessar suas músicas curtidas.</Link></p> : loading ? <p role="status">Carregando favoritos…</p> : <>
      {!error && <><TrackList tracks={tracks.slice(paging.offset, paging.offset + paging.size)} offset={paging.offset} onPlay={play} emptyMessage="Você ainda não curtiu nenhuma música." /><Pagination page={paging.page} size={paging.size} total={tracks.length} onPage={paging.setPage} onSize={paging.setSize} /></>}
      {tracks.length > paging.size && <p className="muted">Ao ouvir, a fila usa as faixas desta página.</p>}
    </>}
  </section>;
}
