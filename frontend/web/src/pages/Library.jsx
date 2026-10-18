import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import Catalog from './Catalog';
import ArtistImage from '../components/ArtistImage';
import Pagination from '../components/Pagination';

export default function Library() {
  const { user, generation } = useAuth();
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => { setPage(1); }, [user?.id, generation]);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError('');
    if (user) api.get('/me/followed-artists', { params: { limit: size, offset: (page - 1) * size }, signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const last = Math.max(1, Math.ceil(data.pagination.total / size));
        if (page > last) setPage(last);
        else setResult({ ...data, generation });
      }).catch(error => { if (!controller.signal.aborted) setError(error.response?.data?.error || 'Não foi possível carregar os artistas seguidos.'); });
    return () => controller.abort();
  }, [user?.id, generation, page, size, revision]);
  return <>
    <Catalog kind="playlists" />
    {user && <p><Link to="/history">Ver histórico de escuta</Link></p>}
    {user && <section aria-label="Artistas seguidos"><h2>Artistas seguidos</h2>
      {error ? <p role="alert">{error} <button onClick={() => setRevision(value => value + 1)}>Tentar novamente</button></p> : !result || result.generation !== generation ? <p role="status">Carregando artistas…</p> : <>
        <div className="cards">{result.data.map(artist => <Link className="card" key={artist.id} to={`/artist/${artist.id}`}><ArtistImage artist={artist} /><h3>{artist.name}</h3></Link>)}</div>
        {!result.data.length && <p>Você ainda não segue artistas. Abra uma música e visite seu artista para começar.</p>}
        <Pagination page={page} size={size} total={result.pagination.total} onPage={setPage} onSize={value => { setSize(value); setPage(1); }} />
      </>}
    </section>}
  </>;
}
