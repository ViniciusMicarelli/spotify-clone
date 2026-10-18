import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import FavoriteButton from '../components/FavoriteButton';

const titles = { tracks: 'Músicas para ouvir agora', artists: 'Artistas', albums: 'Álbuns', playlists: 'Sua biblioteca' };
export default function Catalog({ kind, search = false, create = false }) {
  const { id, query } = useParams();
  const { play } = useOutletContext();
  const { isAuthenticated, user, token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setTracks([]); setError('');
    if (create) return () => controller.abort();
    async function load() {
      try {
        const { data: result } = await api.get(`/${kind}${id ? `/${id}` : ''}`, { params: search ? { search: query || '' } : kind === 'playlists' && user ? { userId: user.id } : {}, signal: controller.signal });
        let songs = kind === 'tracks' ? (id ? [result.data] : result.data) : [];
        if (id && kind !== 'tracks') {
          const { data: all } = await api.get('/tracks', { params: kind === 'artists' ? { artistId: id } : kind === 'albums' ? { albumId: id } : {}, signal: controller.signal });
          songs = kind === 'playlists' ? all.data.filter(track => result.data.tracks.includes(track.id)) : all.data;
        }
        if (!controller.signal.aborted) { setData(result.data); setTracks(songs); }
      } catch (error) { if (!controller.signal.aborted) setError(error.response?.data?.error || 'Não foi possível carregar o catálogo. Verifique se a API está iniciada.'); }
    }
    load();
    return () => controller.abort();
  }, [kind, id, search, query, create, user?.id, token]);
  async function submit(event) {
    event.preventDefault(); setPending(true); setError('');
    try { const { data } = await api.post('/playlists', { name }); navigate(`/playlist/${data.data.id}`); }
    catch (error) { setError(error.response?.data?.error || 'Não foi possível criar a playlist.'); }
    finally { setPending(false); }
  }
  if (create) return <section><h1>Criar playlist</h1>{isAuthenticated ? <form onSubmit={submit}><label>Nome<input required value={name} onChange={e => setName(e.target.value)} /></label><button disabled={pending}>Criar</button></form> : <p><Link to="/auth/login">Entre para criar uma playlist.</Link></p>}{error && <p role="alert">{error}</p>}</section>;
  return <section><p className="eyebrow">SEU ESPAÇO DE MÚSICA</p><h1>{id ? data?.name || data?.title || 'Carregando…' : search ? `Busca${query ? `: ${query}` : ''}` : titles[kind]}</h1>
    {kind === 'playlists' && !id && !user && <p>Playlists públicas. <Link to="/auth/login">Entre para acessar sua biblioteca.</Link></p>}
    {error ? <p role="alert">{error}</p> : data === null ? <p role="status">Carregando catálogo…</p> : <>
    {Array.isArray(data) && kind !== 'tracks' && <div className="cards">{data.map(item => <Link className="card" key={item.id} to={`/${kind === 'playlists' ? 'playlist' : kind === 'artists' ? 'artist' : 'album'}/${item.id}`}><div className="cover">♫</div><h2>{item.name}</h2><p className="muted">{item.description || kind}</p></Link>)}{!data.length && <p>Nenhum resultado.</p>}</div>}
    {(kind === 'tracks' || id) && <div className="track-list">{tracks.map((track, index) => <article key={track.id}><span className="muted">{index + 1}</span><div><Link to={`/track/${track.id}`}><strong>{track.title}</strong></Link><p className="muted"><Link to={`/album/${track.album.id}`}>{track.album.name}</Link> · {track.artists.map(artist => <Link key={artist} to={`/artist/${artist}`}>{track.artistDetails?.find(item => item.id === artist)?.name || `Artista ${artist}`} </Link>)}</p></div><span>{Math.floor(track.duration / 60000)}:{String(Math.floor(track.duration / 1000) % 60).padStart(2, '0')}</span><button onClick={() => play(track, tracks)}>Ouvir</button><FavoriteButton track={track} /></article>)}{!tracks.length && <p>Nenhuma faixa encontrada.</p>}</div>}
    </>}
  </section>;
}
