import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import TrackTechnical from '../components/TrackTechnical';
import ArtistDetails from '../components/ArtistDetails';
import CatalogImage from '../components/CatalogImage';
import ArtistImage from '../components/ArtistImage';
import TrackList from '../components/TrackList';
import Pagination from '../components/Pagination';
import usePage from '../hooks/usePage';
const titles = { tracks: 'Músicas para ouvir agora', artists: 'Artistas', albums: 'Álbuns', playlists: 'Sua biblioteca' };
export default function Catalog({ kind, search = false }) {
  const { id, query } = useParams();
  const [searchParams] = useSearchParams();
  const genre = search && kind === 'artists' ? searchParams.get('genre') || '' : '';
  const { play } = useOutletContext();
  const { user, token } = useAuth();
  const paging = usePage();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const singleTrack = kind === 'tracks' && Boolean(id);
  useEffect(() => {
    const controller = new AbortController(); setResult(null); setError('');
    async function load() {
      try {
        const params = { limit: paging.size, offset: paging.offset, ...(search ? { search: query || '' } : {}), ...(genre ? { genre } : {}), ...(kind === 'playlists' && user ? { userId: user.id } : {}) };
        const detail = await api.get(`/${kind}${id ? `/${id}` : ''}`, { params: id ? {} : params, signal: controller.signal });
        let data = detail.data;
        if (id && kind !== 'tracks') data = (await api.get('/tracks', { params: { limit: paging.size, offset: paging.offset, ...(kind === 'artists' ? { artistId: id } : { albumId: id }) }, signal: controller.signal })).data;
        const total = singleTrack ? 1 : data.pagination.total;
        const last = Math.max(1, Math.ceil(total / paging.size));
        if (!controller.signal.aborted && !singleTrack && paging.page > last) { paging.setPage(last, true); return; }
        if (!controller.signal.aborted) setResult({ detail: detail.data.data, items: singleTrack ? [data.data] : data.data, total });
      } catch (error) { if (!controller.signal.aborted) setError(error.response?.data?.error || 'Não foi possível carregar o catálogo. Verifique a conexão e tente novamente.'); }
    }
    load(); return () => controller.abort();
  }, [kind, id, search, query, user?.id, token, paging.page, paging.size, revision, genre]);
  const isTracks = kind === 'tracks' || Boolean(id);
  return <section><p className="eyebrow">SEU ESPAÇO DE MÚSICA</p><h1>{id ? result?.detail.name || result?.detail.title || 'Carregando…' : search ? `Busca${query ? `: ${query}` : ''}` : titles[kind]}</h1>
    {search && <p className="muted">{kind === 'artists' ? 'Artistas por nome' : kind === 'albums' ? 'Álbuns por nome' : 'Músicas por título, artista ou álbum'}</p>}
    {kind === 'playlists' && !user && <p>Playlists públicas. <Link to="/auth/login">Entre para acessar sua biblioteca.</Link></p>}
    {error ? <p role="alert">{error} <button onClick={() => setRevision(value => value + 1)}>Tentar novamente</button></p> : !result ? <p role="status">Carregando catálogo…</p> : <>
      {kind === 'artists' && id && <ArtistDetails key={id} artist={result.detail} />}
      {kind === 'albums' && id && <section className="artist-details" aria-label="Sobre o álbum"><CatalogImage item={result.detail} kind="albums" detail /><div><h2>Sobre o álbum</h2><p><strong>Ano:</strong> {result.detail.year ?? 'Não informado'}</p><p><strong>Gêneros:</strong> {result.detail.genres?.length ? result.detail.genres.join(', ') : 'Não informados'}</p><p>{result.detail.totalTracks} faixas · {result.detail.duration.formatted}</p></div></section>}
      {singleTrack && <TrackTechnical technical={result.detail.technical} />}
      {isTracks ? <TrackList tracks={result.items} onPlay={play} offset={singleTrack ? 0 : paging.offset} /> : <div className="cards">{result.items.map(item => <Link className="card" key={item.id} to={`/${kind === 'playlists' ? 'playlist' : kind === 'artists' ? 'artist' : 'album'}/${item.id}`}>{kind === 'artists' ? <ArtistImage artist={item} /> : kind === 'albums' ? <CatalogImage item={item} kind="albums" /> : <div className="cover">♫</div>}<h2>{item.name}</h2><p className="muted">{kind === 'artists' ? `${item.followers} seguidores${item.genres?.length ? ` · ${item.genres.join(', ')}` : ''}` : kind === 'albums' ? `${item.year ? `${item.year} · ` : ''}${item.totalTracks} faixas · ${item.duration.formatted}` : item.description || 'Playlist'}</p></Link>)}{!result.items.length && <p>Nenhum resultado.</p>}</div>}
      {!singleTrack && <Pagination page={paging.page} size={paging.size} total={result.total} onPage={paging.setPage} onSize={paging.setSize} />}
      {isTracks && result.total > paging.size && <p className="muted">Ao ouvir, a fila usa as faixas desta página.</p>}
    </>}
  </section>;
}
