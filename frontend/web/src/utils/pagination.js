export const PAGE_SIZES = [10, 20, 50];
export function paginationState(params, total) {
  const size = PAGE_SIZES.includes(Number(params.get('size'))) ? Number(params.get('size')) : 20;
  const raw = params.get('page');
  const requestedPage = /^\d+$/.test(raw || '') && Number.isSafeInteger(Number(raw)) && Number(raw) > 0 && Number(raw) <= Math.floor(Number.MAX_SAFE_INTEGER / size) ? Number(raw) : 1;
  const pages = total === undefined ? undefined : Math.max(1, Math.ceil(total / size));
  const page = pages === undefined ? requestedPage : Math.min(requestedPage, pages);
  return { requestedPage, page, size, pages, offset: (page - 1) * size };
}
