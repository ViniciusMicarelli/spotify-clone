export function parsePagination(query) {
  const { limit = '50', offset = '0' } = query;
  const valid = value => typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
  if (!valid(limit) || !valid(offset) || Number(limit) < 1 || Number(limit) > 100) return null;
  return { limit: Number(limit), offset: Number(offset) };
}
