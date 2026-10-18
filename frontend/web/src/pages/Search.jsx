import { Link, useParams, useSearchParams } from 'react-router-dom';
import AlbumArtistFilter from '../components/AlbumArtistFilter';
import Catalog from './Catalog';
import ArtistGenreFilter from '../components/ArtistGenreFilter';
import { SEARCH_TYPES, searchType, searchUrl } from '../utils/search';

export default function Search() {
  const { query = '' } = useParams();
  const [params] = useSearchParams();
  const type = searchType(params);
  return <>
    <nav className="search-types" aria-label="Tipos de resultado">{Object.entries(SEARCH_TYPES).map(([value, label]) => <Link key={value} to={searchUrl(query, params, value)} aria-current={type === value ? 'page' : undefined}>{label}</Link>)}</nav>
    {type === 'artists' && <ArtistGenreFilter />}
    {type === 'albums' && <AlbumArtistFilter />}
    <Catalog key={`${type}:${query}:${type === 'artists' ? params.get('genre') || '' : type === 'albums' ? params.get('artistId') || '' : ''}`} kind={type} search />
  </>;
}
