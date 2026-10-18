import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { albumArtistUrl } from '../utils/search';
import Pagination from './Pagination';
export default function AlbumArtistFilter() {
  const { query = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const artistId = params.get('artistId') || '';
  const [current, setCurrent] = useState(null);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState('');
  const [state, setState] = useState({ data: [], total: 0, loading: true, error: false });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setCurrent(null);
    if (artistId) api.get(`/artists/${encodeURIComponent(artistId)}`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setCurrent({ id: artistId, name: data.data.name }); })
      .catch(() => { if (!controller.signal.aborted) setCurrent({ id: artistId, name: 'Artista indisponível' }); });
    return () => controller.abort();
  }, [artistId, revision]);
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: [], total: 0, loading: true, error: false }); setSelected('');
    api.get('/artists', { params: { search, limit: 20, offset: (page - 1) * 20 }, signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const last = Math.max(1, Math.ceil(data.pagination.total / 20));
        if (page > last) { setPage(last); return; }
        setState({ data: data.data, total: data.pagination.total, loading: false, error: false });
      }).catch(() => { if (!controller.signal.aborted) setState({ data: [], total: 0, loading: false, error: true }); });
    return () => controller.abort();
  }, [search, page, revision]);
  return <section className="album-artist-filter" aria-label="Filtro de artista do álbum"><h2>Artista do álbum</h2>
    <p>{artistId ? `Selecionado: ${current?.id === artistId ? current.name : 'Carregando artista…'}` : 'Todos os artistas'}</p>
    {artistId && <button className="secondary" onClick={() => navigate(albumArtistUrl(query, params, ''))}>Limpar artista</button>}
    <form onSubmit={event => { event.preventDefault(); setSearch(input.trim()); setPage(1); setRevision(value => value + 1); }}><label>Buscar artista para filtrar<input value={input} onChange={event => setInput(event.target.value)} /></label><button>Buscar artistas</button></form>
    {state.error ? <p role="alert">Não foi possível carregar os artistas. <button onClick={() => setRevision(value => value + 1)}>Recarregar artistas</button></p> : state.loading ? <p role="status">Carregando artistas…</p> : <>
      <form onSubmit={event => { event.preventDefault(); if (selected) navigate(albumArtistUrl(query, params, selected)); }}><label>Selecionar artista<select value={selected} onChange={event => setSelected(event.target.value)}><option value="">Selecione um artista</option>{state.data.map(artist => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label><button disabled={!selected}>Aplicar artista</button></form>
      {!state.data.length && <p>Nenhum artista encontrado.</p>}
      <Pagination page={page} size={20} total={state.total} onPage={setPage} />
    </>}
  </section>;
}
