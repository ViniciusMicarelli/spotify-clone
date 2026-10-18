import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
import Pagination from './Pagination';
export default function TrackPicker({ included, pending, onAdd }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setSelected(''); setItems([]); setTotal(0);
    api.get('/tracks', { params: { search, limit: 20, offset: (page - 1) * 20 }, signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) { const last = Math.max(1, Math.ceil(data.pagination.total / 20)); if (page > last) { setPage(last); return; } setItems(data.data); setTotal(data.pagination.total); setLoading(false); }
    }).catch(error => { if (!controller.signal.aborted) { setError(error.response?.data?.error || 'Não foi possível buscar músicas.'); setLoading(false); } });
    return () => controller.abort();
  }, [page, search]);
  const available = items.filter(track => !included.includes(track.id));
  return <div className="track-picker"><h2>Adicionar música</h2>
    <form onSubmit={event => { event.preventDefault(); setSearch(query); setPage(1); }}><label>Buscar no catálogo<input value={query} onChange={event => setQuery(event.target.value)} /></label><button>Buscar faixas</button></form>
    {error && <p role="alert">{error}</p>}{loading ? <p role="status">Buscando faixas…</p> : <>
      <form onSubmit={async event => { event.preventDefault(); if (await onAdd(selected)) setSelected(''); }}><label>Faixa<select required value={included.includes(selected) ? '' : selected} onChange={event => setSelected(event.target.value)}><option value="">Selecione uma faixa</option>{available.map(track => <option key={track.id} value={track.id}>{track.title}</option>)}</select></label><button disabled={pending || !selected || included.includes(selected)}>Adicionar faixa</button></form>
      {!available.length && !error && <p className="muted">Nenhuma faixa disponível nesta página. Busque ou navegue pelo catálogo.</p>}
      <Pagination page={page} size={20} total={total} onPage={setPage} />
    </>}
  </div>;
}
