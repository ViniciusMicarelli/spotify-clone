import { PAGE_SIZES } from '../utils/pagination';
export default function Pagination({ page, size, total, onPage, onSize }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return <nav className="pagination" aria-label="Paginação"><span>{total ? `${(page - 1) * size + 1}–${Math.min(page * size, total)} de ${total}` : '0 resultados'}</span>
    <div><button className="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Página anterior</button><span aria-live="polite">Página {page} de {pages}</span><button className="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Próxima página</button></div>
    {onSize && <label>Por página<select aria-label="Itens por página" value={size} onChange={event => onSize(Number(event.target.value))}>{PAGE_SIZES.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}
  </nav>;
}
