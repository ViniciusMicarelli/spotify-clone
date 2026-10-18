import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
export default function TrackList({ tracks, onPlay, offset = 0, renderActions, itemKey = track => track.id, emptyMessage = 'Nenhuma faixa encontrada.' }) {
  if (!tracks.length) return <p>{emptyMessage}</p>;
  return <div className="track-list">{tracks.map((track, index) => <article key={itemKey(track)} data-track-id={track.id}>
    <span className="muted">{offset + index + 1}</span><div><Link to={`/track/${track.id}`}><strong>{track.title}</strong></Link><p className="muted"><Link to={`/album/${track.album.id}`}>{track.album.name}</Link>{track.artists.map(id => <span key={id}> · <Link to={`/artist/${id}`}>{track.artistDetails?.find(artist => artist.id === id)?.name || `Artista ${id}`}</Link></span>)}</p></div>
    <span>{Math.floor(track.duration / 60000)}:{String(Math.floor(track.duration / 1000) % 60).padStart(2, '0')}</span><button onClick={() => onPlay(track, tracks)}>Ouvir</button><FavoriteButton track={track} />{renderActions?.(track, offset + index)}
  </article>)}</div>;
}
