import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { paginationState } from '../utils/pagination';
export default function usePage(total) {
  const [params, setParams] = useSearchParams();
  const state = paginationState(params, total);
  function setPage(page, replace = false) {
    const next = new URLSearchParams(params);
    if (page <= 1) next.delete('page'); else next.set('page', String(page));
    setParams(next, { replace });
  }
  function setSize(size) {
    const next = new URLSearchParams(params); next.set('size', String(size)); next.delete('page'); setParams(next);
  }
  useEffect(() => {
    if (total !== undefined && state.requestedPage !== state.page) setPage(state.page, true);
  }, [total, state.requestedPage, state.page]);
  return { ...state, setPage, setSize };
}
