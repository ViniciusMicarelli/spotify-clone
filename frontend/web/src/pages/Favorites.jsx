import { Link, useOutletContext } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import FavoriteButton from '../components/FavoriteButton';

export default function Favorites() {
  const { tracks, authenticated, loading, error } = useFavorites();
  const { play } = useOutletContext();
  return <section><p className="eyebrow">SUA COLEÇÃO</p><h1>Músicas curtidas</h1>
    {!authenticated ? <p><Link to="/auth/login">Entre para acessar suas músicas curtidas.</Link></p> : loading ? <p role="status">Carregando favoritos…</p> : <>
      <div className="track-list">{tracks.map((track, index) => <article key={track.id} data-track-id={track.id}><span>{index + 1}</span><div><Link to={`/track/${track.id}`}><strong>{track.title}</strong></Link><p className="muted">{track.album.name}</p></div><button onClick={() => play(track, tracks)}>Ouvir</button><FavoriteButton track={track} /></article>)}</div>
      {!tracks.length && !error && <p>Você ainda não curtiu nenhuma música. <Link to="/">Explore o catálogo.</Link></p>}
    </>}
  </section>;
}
