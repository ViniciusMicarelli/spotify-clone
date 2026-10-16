import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoriteButton({ track }) {
  const { tracks, toggle, authenticated, loading, pending, error } = useFavorites();
  if (!authenticated) return <Link className="favorite-login" to="/auth/login" aria-label={`Entrar para curtir ${track.title}`}>♡</Link>;
  const liked = tracks.some(item => item.id === track.id);
  return <button className="favorite-button" aria-pressed={liked} aria-label={`${liked ? 'Descurtir' : 'Curtir'} ${track.title}`} title={error || undefined} disabled={loading || pending || Boolean(error)} onClick={() => toggle(track)}>{liked ? '♥' : '♡'}</button>;
}
