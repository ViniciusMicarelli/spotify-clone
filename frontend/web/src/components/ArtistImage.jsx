import { useState } from 'react';
import { api } from '../context/AuthContext';
export default function ArtistImage({ artist, detail = false }) {
  let src;
  try {
    const value = artist.images?.[0]?.url;
    if (value) {
      const url = new URL(value, new URL(api.defaults.baseURL, window.location.href));
      if (['http:', 'https:'].includes(url.protocol)) src = url.href;
    }
  } catch { /* Old or unavailable image metadata uses the fallback. */ }
  const [failed, setFailed] = useState(null);
  return <div className={`artist-image${detail ? ' artist-portrait' : ' cover'}`}>
    {src && failed !== src ? <img src={src} alt={`Retrato de ${artist.name}`} loading="lazy" onError={() => setFailed(src)} /> : <span role="img" aria-label={`Foto indisponível de ${artist.name}`}>♫</span>}
  </div>;
}
