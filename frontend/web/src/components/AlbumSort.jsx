import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { albumSortUrl } from '../utils/search';
const options = { default: 'Padrão', name_asc: 'Nome: A–Z', name_desc: 'Nome: Z–A', year_desc: 'Ano: mais recentes', year_asc: 'Ano: mais antigos' };
export default function AlbumSort() {
  const { query = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sort = params.get('sort') ?? 'default';
  return <div className="genre-filter"><label>Ordenar álbuns<select value={sort} onChange={event => navigate(albumSortUrl(query, params, event.target.value))}>
    {!Object.hasOwn(options, sort) && <option value={sort}>Ordenação inválida</option>}
    {Object.entries(options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
  </select></label></div>;
}
