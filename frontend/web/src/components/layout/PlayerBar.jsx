import { useEffect, useRef, useState } from 'react';
import FavoriteButton from '../FavoriteButton';
import { api } from '../../context/AuthContext';

const format = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
export default function PlayerBar({ track, request, position, total, hasNext, shuffle, repeat, onShuffle, onRepeat, onEnded, onNext, onPrev }) {
  const audio = useRef(null);
  const [status, setStatus] = useState('idle');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState('');
  const source = track?.url ? new URL(track.url, new URL(api.defaults.baseURL, window.location.href)).href : undefined;
  useEffect(() => {
    const element = audio.current;
    let cancelled = false;
    element.pause();
    setTime(0); setDuration(0); setError(''); setStatus(track ? 'loading' : 'idle');
    if (track) {
      element.load();
      element.play().catch(cause => {
        if (cancelled || cause.name === 'AbortError') return;
        setStatus(cause.name === 'NotAllowedError' ? 'paused' : 'error');
        setError(cause.name === 'NotAllowedError' ? 'Clique em Reproduzir para iniciar o áudio.' : 'Não foi possível reproduzir esta faixa. Tente novamente ou escolha outra.');
      });
    }
    return () => { cancelled = true; element.pause(); };
  }, [track?.id, source, request]);
  useEffect(() => { audio.current.volume = volume; }, [volume]);
  function toggle() {
    const element = audio.current;
    if (!element.paused) { element.pause(); return; }
    setError('');
    if (element.error) { element.load(); setStatus('loading'); }
    element.play().catch(cause => {
      if (cause.name === 'AbortError') return;
      setStatus('error'); setError('Não foi possível reproduzir esta faixa. Tente novamente ou escolha outra.');
    });
  }
  function previous() {
    if (audio.current.currentTime > 3 || (position === 1 && repeat !== 'all')) {
      audio.current.currentTime = 0; setTime(0);
      if (status === 'ended') setStatus('paused');
    } else onPrev();
  }
  const labels = { idle: 'Nenhuma faixa selecionada', loading: 'Carregando áudio…', playing: 'Reproduzindo', paused: 'Pausado', ended: 'Fim da fila', error: 'Áudio indisponível' };
  return <footer className="player-bar" data-state={status} data-track-id={track?.id}>
    <div><strong>{track?.title || 'Selecione uma música'}</strong>{track && <FavoriteButton track={track} />}<p className="player-status"><output aria-label="Estado da reprodução">{labels[status]}</output>{track && ` · Faixa ${position} de ${total}`}</p>{error && <p role="alert">{error}</p>}</div>
    <audio ref={audio} src={source} preload="metadata" onPlaying={() => { setStatus('playing'); setError(''); }} onPause={() => setStatus(current => current === 'playing' ? 'paused' : current)} onTimeUpdate={event => setTime(event.target.currentTime)} onLoadedMetadata={event => setDuration(Number.isFinite(event.target.duration) ? event.target.duration : 0)} onEnded={() => { setStatus('ended'); if (hasNext || repeat === 'one') onEnded(); }} onError={() => { if (track) { setStatus('error'); setError('Áudio indisponível. Tente novamente ou escolha outra faixa.'); } }} />
    <div className="playback"><div className="transport-controls"><button className="mode-button" aria-label="Aleatório" aria-pressed={shuffle} onClick={onShuffle}>Aleatório</button><button disabled={!track || !duration} onClick={previous}>Anterior</button><button disabled={!track} onClick={toggle}>{status === 'playing' ? 'Pausar' : 'Reproduzir'}</button><button disabled={!hasNext} onClick={onNext}>Próxima</button><button className="mode-button" aria-label="Repetição" aria-pressed={repeat !== 'off'} data-repeat={repeat} onClick={onRepeat}>Repetir: {{ off: 'desligado', all: 'fila', one: 'faixa' }[repeat]}</button></div>
      <label className="timeline">{format(time)}<input aria-label="Progresso da faixa" aria-valuenow={Number(time.toFixed(1))} type="range" min="0" max={duration || 0} value={Math.min(time, duration)} step="0.1" disabled={!duration} onChange={event => { const target = Number(event.target.value); audio.current.currentTime = target; setTime(target); if (status === 'ended') setStatus('paused'); }} />{format(duration)}</label>
    </div>
    <label>Volume<input aria-label="Volume" aria-valuenow={Math.round(volume * 100)} aria-valuetext={`${Math.round(volume * 100)}%`} type="range" min="0" max="1" step="0.01" value={volume} onChange={event => setVolume(Number(event.target.value))} /></label>
  </footer>;
}
