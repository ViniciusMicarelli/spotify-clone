import { useEffect, useState } from 'react';
import { api } from '../context/AuthContext';
export default function Waveform({ track, duration, time, onSeek, disabled }) {
  const [state, setState] = useState({ loading: true, data: null });
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, data: null });
    api.get(`/tracks/${track.id}/waveform`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setState({ loading: false, data: data.data }); })
      .catch(() => { if (!controller.signal.aborted) setState({ loading: false, data: null }); });
    return () => controller.abort();
  }, [track.id, track.url]);
  if (!state.data) return <p className="waveform-note">{state.loading ? 'Carregando forma de onda…' : 'Forma de onda indisponível. Use a barra de progresso.'}</p>;
  const ratio = duration > 0 ? Math.min(1, Math.max(0, time / duration)) : 0;
  return <div className="waveform" data-track-id={track.id}>
    <svg viewBox="0 0 288 40" preserveAspectRatio="none" aria-hidden="true">{state.data.peaks.map((peak, index) => {
      const height = Math.max(1, peak * 38);
      return <rect key={index} x={index * 3} y={(40 - height) / 2} width="2" height={height} fill={index / state.data.peaks.length < ratio ? '#1ed760' : '#888'} />;
    })}</svg>
    <input type="range" aria-label="Posição na forma de onda" aria-valuetext={`${time.toFixed(1)} de ${duration.toFixed(1)} segundos`} min="0" max={duration || 0} step="0.1" value={Math.min(time, duration)} disabled={disabled || !duration} onChange={event => onSeek(Number(event.target.value))} />
  </div>;
}
