import { useAuth } from '../context/AuthContext';
import ArtistImage from './ArtistImage';
import FollowButton from './FollowButton';
export default function ArtistDetails({ artist }) {
  const { user } = useAuth();
  return <section className="artist-details" aria-label="Sobre o artista">
    <ArtistImage artist={artist} detail />
    <div><h2>Sobre o artista</h2>
      <p className="artist-biography">{artist.biography || 'Biografia ainda não informada.'}</p>
      <p><strong>País:</strong> {artist.country || 'Não informado'}</p>
      <p><strong>Gêneros:</strong> {artist.genres?.length ? artist.genres.join(', ') : 'Não informados'}</p>
      {!user && <p className="muted">{artist.followers} seguidores</p>}
      <FollowButton artist={artist} />
    </div>
  </section>;
}
