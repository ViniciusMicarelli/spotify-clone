import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { albumYearUrl } from '../utils/search';
export default function AlbumYearFilter() {
  const { query = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const year = params.get('year') || '';
  const [draft, setDraft] = useState(year);
  useEffect(() => { setDraft(year); }, [year]);
  return <form className="genre-filter" onSubmit={event => { event.preventDefault(); if (!draft || /^[1-9]\d{0,3}$/.test(draft)) navigate(albumYearUrl(query, params, draft)); }}>
    <label>Ano do álbum<input inputMode="numeric" pattern="[1-9][0-9]{0,3}" maxLength="4" placeholder="1–9999" value={draft} onChange={event => setDraft(event.target.value)} /></label>
    <button>Aplicar ano</button>
    {params.has('year') && <button type="button" className="secondary" onClick={() => navigate(albumYearUrl(query, params, ''))}>Limpar ano</button>}
  </form>;
}
