export const SEARCH_TYPES = { tracks: 'Músicas', artists: 'Artistas', albums: 'Álbuns' };
export function searchType(params) {
  const type = params.get('type');
  return Object.hasOwn(SEARCH_TYPES, type) ? type : 'tracks';
}
export function searchUrl(query, params = new URLSearchParams(), type = searchType(params)) {
  const next = new URLSearchParams(params);
  next.delete('page');
  if (type !== 'artists') next.delete('genre');
  if (type !== 'albums') { next.delete('artistId'); next.delete('year'); next.delete('sort'); }
  if (type === 'tracks' || !Object.hasOwn(SEARCH_TYPES, type)) next.delete('type');
  else next.set('type', type);
  const term = query.trim();
  return `/search${term ? `/${encodeURIComponent(term)}` : ''}${next.size ? `?${next}` : ''}`;
}

export function genreUrl(query, params, genre) {
  const next = new URLSearchParams(params);
  if (genre) next.set('genre', genre); else next.delete('genre');
  return searchUrl(query, next, 'artists');
}

export function albumArtistUrl(query, params, artistId) {
  const next = new URLSearchParams(params);
  if (artistId) next.set('artistId', artistId); else next.delete('artistId');
  return searchUrl(query, next, 'albums');
}

export function albumYearUrl(query, params, year) {
  const next = new URLSearchParams(params);
  if (year) next.set('year', year); else next.delete('year');
  return searchUrl(query, next, 'albums');
}

export function albumSortUrl(query, params, sort) {
  const next = new URLSearchParams(params);
  if (sort === 'default') next.delete('sort'); else next.set('sort', sort);
  return searchUrl(query, next, 'albums');
}
