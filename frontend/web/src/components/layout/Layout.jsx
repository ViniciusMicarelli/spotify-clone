import { useEffect, useReducer, useState } from 'react';
import { initialQueue, queueReducer, shuffledIds, canAdvance } from '../../player/queue';
import { Link, NavLink, Outlet, useNavigate, useMatch, useSearchParams } from 'react-router-dom';
import { useAuth, useAuthStore } from '../../context/AuthContext';
import { searchUrl } from '../../utils/search';
import PlayerBar from './PlayerBar';
import { FavoritesProvider, useFavorites } from '../../context/FavoritesContext';

export default function Layout() { return <FavoritesProvider><LayoutContent /></FavoritesProvider>; }

function LayoutContent() {
  const favorites = useFavorites();
  const { user, token, signOut, ending, error: sessionError, initialize } = useAuth();
  useEffect(() => { if (token) useAuthStore.getState().refreshUser(); }, [token]);
  const [queue, dispatch] = useReducer(queueReducer, initialQueue);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const searchMatch = useMatch('/search/:query?');
  const [params] = useSearchParams();
  useEffect(() => { setQuery(searchMatch?.params.query || ''); }, [searchMatch?.params.query]);
  function play(track, tracks) { dispatch({ type: 'select', id: track.id, tracks, order: shuffledIds(tracks.slice(tracks.findIndex(item => item.id === track.id) + 1)) }); }
  return <div className="app-shell"><header><Link to="/" className="brand">♫ Spotify Clone</Link><form onSubmit={e => { e.preventDefault(); navigate(searchUrl(query, searchMatch ? params : undefined)); }}><input aria-label="Buscar músicas, artistas ou álbuns" placeholder="Músicas, artistas ou álbuns" value={query} onChange={e => setQuery(e.target.value)} /><button>Buscar</button></form><div>{user ? <><Link to="/profile">{user.name}</Link> <button disabled={ending} onClick={signOut}>{ending ? 'Saindo…' : 'Sair'}</button></> : <Link to="/auth/login">Entrar</Link>}</div></header>
    <aside><nav><NavLink to="/">Início</NavLink><NavLink to="/search">Buscar</NavLink><NavLink to="/library">Sua biblioteca</NavLink><NavLink to="/history">Histórico de escuta</NavLink><NavLink to="/liked-songs">Músicas curtidas</NavLink><NavLink to="/create-playlist">Criar playlist</NavLink>{user && <NavLink to="/profile">Meu perfil</NavLink>}</nav><p className="muted">Áudios instrumentais de demonstração gerados localmente.</p>{queue.tracks.length > 0 && <section className="queue-panel"><h2>Fila de reprodução</h2><ol>{queue.tracks.map((track, index) => <li key={track.id} data-queue-track-id={track.id}><button className="queue-track" aria-current={index === queue.index ? "true" : undefined} onClick={() => dispatch({ type: 'jump', index })}>{track.title}</button><button className="queue-remove" aria-label={`Retirar ${track.title} da fila`} onClick={() => dispatch({ type: 'remove', id: track.id })}>×</button></li>)}</ol><button className="secondary" onClick={() => dispatch({ type: 'clear' })}>Limpar fila</button></section>}</aside>
    <main className="content">{sessionError && <div role="alert">{sessionError} {!user && <button onClick={initialize}>Tentar novamente</button>}</div>}{favorites.error && <div className="favorites-error" role="alert">{favorites.error} <button onClick={favorites.retry}>Tentar novamente</button></div>}<Outlet context={{ play }} /></main>
    <PlayerBar track={queue.tracks[queue.index]} request={queue.request} position={queue.index + 1} total={queue.tracks.length} hasNext={canAdvance(queue)} shuffle={queue.shuffle} repeat={queue.repeat} onShuffle={() => dispatch({ type: 'shuffle', order: shuffledIds(queue.tracks.slice(queue.index + 1)) })} onRepeat={() => dispatch({ type: 'repeat' })} onEnded={() => dispatch({ type: 'ended' })} onNext={() => dispatch({ type: 'next' })} onPrev={() => dispatch({ type: 'previous' })} />
  </div>;
}
