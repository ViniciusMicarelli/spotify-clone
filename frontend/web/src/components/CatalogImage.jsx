import { useState } from 'react';
import { api } from '../context/AuthContext';
export default function CatalogImage({ item, kind, detail = false }) {
  let src;
  try {
    const value = item.images?.[0]?.url;
    if (value) {
      const url = new URL(value, new URL(api.defaults.baseURL, window.location.href));
      if (['http:', 'https:'].includes(url.protocol)) src = url.href;
    }
  } catch { /* Old or unavailable image metadata uses the fallback. */ }
  const [failed, setFailed] = useState(null);
  return <div className={`artist-image${detail ? ' artist-portrait' : ' cover'}`}>
    {src && failed !== src ? <img src={src} alt={`${kind === 'artists' ? 'Retrato' : 'Capa'} de ${item.name}`} loading="lazy" onError={() => setFailed(src)} /> : <span role="img" aria-label={`${kind === 'artists' ? 'Foto' : 'Capa'} indisponível de ${item.name}`}>♫</span>}
  </div>;
}
