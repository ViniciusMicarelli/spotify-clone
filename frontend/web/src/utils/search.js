export const SEARCH_TYPES = { tracks: 'Músicas', artists: 'Artistas', albums: 'Álbuns' };
export function searchType(params) {
  const type = params.get('type');
  return Object.hasOwn(SEARCH_TYPES, type) ? type : 'tracks';
}
export function searchUrl(query, params = new URLSearchParams(), type = searchType(params)) {
  const next = new URLSearchParams(params);
  next.delete('page');
  if (type === 'tracks' || !Object.hasOwn(SEARCH_TYPES, type)) next.delete('type');
  else next.set('type', type);
  const term = query.trim();
  return `/search${term ? `/${encodeURIComponent(term)}` : ''}${next.size ? `?${next}` : ''}`;
}
