import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api, useAuth } from './AuthContext';

const FavoritesContext = createContext(null);
export function FavoritesProvider({ children }) {
  const { token } = useAuth();
  const session = useRef(token);
  session.current = token;
  const [state, setState] = useState({ token: null, tracks: [], loading: false, pending: false, error: '' });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ token, tracks: [], loading: Boolean(token), pending: false, error: '' });
    if (token) api.get('/me/liked-tracks', { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) setState({ token, tracks: data.data, loading: false, pending: false, error: '' });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ token, tracks: [], loading: false, pending: false, error: error.response?.data?.error || 'Não foi possível carregar os favoritos.' });
    });
    return () => controller.abort();
  }, [token, revision]);
  const current = state.token === token ? state : { tracks: [], loading: Boolean(token), pending: false, error: '' };
  async function toggle(track) {
    if (!token || current.loading || current.pending || current.error) return;
    const liked = current.tracks.some(item => item.id === track.id);
    setState(previous => ({ ...previous, pending: true, error: '' }));
    try {
      const { data } = await api.request({ method: liked ? 'delete' : 'put', url: `/me/liked-tracks/${track.id}` });
      if (session.current === token) setState({ token, tracks: data.data, loading: false, pending: false, error: '' });
    } catch (error) {
      if (session.current === token) setState(previous => ({ ...previous, pending: false, error: error.response?.data?.error || 'Não foi possível atualizar os favoritos.' }));
    }
  }
  return <FavoritesContext.Provider value={{ ...current, toggle, retry: () => setRevision(value => value + 1), authenticated: Boolean(token) }}>{children}</FavoritesContext.Provider>;
}
export const useFavorites = () => useContext(FavoritesContext);
