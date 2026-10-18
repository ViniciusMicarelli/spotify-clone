import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { genreUrl } from '../utils/search';
export default function ArtistGenreFilter() {
  const { query = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const genre = params.get('genre') || '';
  const [state, setState] = useState({ data: [], loading: true, error: false });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: [], loading: true, error: false });
    api.get('/artists/genres', { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setState({ data: data.data, loading: false, error: false });
    }).catch(() => { if (!controller.signal.aborted) setState({ data: [], loading: false, error: true }); });
    return () => controller.abort();
  }, [revision]);
  return <div className="genre-filter"><label>Gênero do artista <select value={genre} disabled={state.loading || state.error} onChange={event => navigate(genreUrl(query, params, event.target.value))}>
    <option value="">Todos os gêneros</option>
    {genre && !state.data.includes(genre) && <option value={genre}>{genre}</option>}
    {state.data.map(value => <option key={value} value={value}>{value}</option>)}
  </select></label>
    {genre && <button className="secondary" onClick={() => navigate(genreUrl(query, params, ''))}>Limpar gênero</button>}
    {state.error && <p role="alert">Não foi possível carregar os gêneros. <button onClick={() => setRevision(value => value + 1)}>Recarregar gêneros</button></p>}
  </div>;
}
