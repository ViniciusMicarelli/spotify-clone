import { create } from 'zustand';
import axios from 'axios';

const options = { baseURL: import.meta.env.VITE_API_URL || '/api/v1', withCredentials: true };
export const api = axios.create(options);
const sessionApi = axios.create(options);
// Access credentials now stay in memory; remove the old localStorage token on upgrade.
localStorage.removeItem('spotify-clone-auth');
let operationChain = Promise.resolve();
function sessionOperation(callback) {
  const execute = () => navigator.locks?.request ? navigator.locks.request('spotify-session', callback) : callback();
  const operation = operationChain.then(execute, execute);
  operationChain = operation.catch(() => {});
  return operation;
}
let refreshPromise;
async function refreshAccess() {
  if (!refreshPromise) {
    const generation = useAuthStore.getState().generation;
    refreshPromise = sessionOperation(async () => {
      if (useAuthStore.getState().generation !== generation) return useAuthStore.getState().token;
      const { data } = await sessionApi.post('/auth/refresh');
      useAuthStore.setState({ user: data.user, token: data.token, error: '' });
      return data.token;
    }).catch(error => {
      if (useAuthStore.getState().generation === generation) {
        if (error.response?.status === 401) useAuthStore.setState({ user: null, token: null, error: '', generation: generation + 1 });
        else useAuthStore.setState({ error: 'Não foi possível recuperar a sessão. Tente novamente.' });
      }
      throw error;
    }).finally(() => { refreshPromise = undefined; });
  }
  return refreshPromise;
}
export const useAuthStore = create((set, get) => ({
  user: null, token: null, ready: false, ending: false, generation: 0, error: '',
  async initialize() {
    try { await refreshAccess(); } catch { /* A missing cookie is a normal guest session. */ }
    finally { set({ ready: true }); }
  },
  async authenticate(path, fields) {
    try {
      await sessionOperation(async () => {
        const { data } = await sessionApi.post(`/auth/${path}`, fields);
        set({ user: data.user, token: data.token, generation: get().generation + 1, error: '', ready: true });
      });
      return { success: true };
    } catch (error) { return { success: false, error: error.response?.data?.error || 'Não foi possível conectar à API.' }; }
  },
  async refreshUser() {
    const { user, generation } = get();
    if (!user) return;
    try {
      const { data } = await api.get('/auth/me');
      if (get().generation === generation) set({ user: data.user });
    } catch { /* Session recovery is handled by the response interceptor. */ }
  },
  async updateProfile(fields) {
    const { generation, user } = get();
    if (!user) return { success: false, error: 'Entre para editar seu perfil.' };
    try {
      const { data } = await api.put(`/users/${user.id}`, fields);
      if (get().generation !== generation) return { success: false, error: 'A sessão foi alterada.' };
      set({ user: data.data });
      return { success: true };
    } catch (error) { return { success: false, error: error.response?.data?.error || 'Não foi possível salvar o perfil.' }; }
  },
  async signOut() {
    if (get().ending) return;
    set({ ending: true, error: '' });
    try {
      await sessionOperation(async () => {
        await sessionApi.post('/auth/signout');
        set({ user: null, token: null, generation: get().generation + 1 });
      });
    } catch { set({ error: 'Não foi possível encerrar a sessão. Tente novamente.' }); }
    finally { set({ ending: false }); }
  }
}));
api.interceptors.request.use(config => {
  const store = useAuthStore.getState();
  config._generation ??= store.generation;
  if (store.token) config.headers.Authorization = `Bearer ${store.token}`;
  else delete config.headers.Authorization;
  return config;
});
api.interceptors.response.use(response => response, async error => {
  const config = error.config;
  const store = useAuthStore.getState();
  if (error.response?.status !== 401 || !config || config._retry || store.ending || config._generation !== store.generation) return Promise.reject(error);
  config._retry = true;
  try {
    if (!store.token || config.headers.Authorization === `Bearer ${store.token}`) await refreshAccess();
    if (config._generation !== useAuthStore.getState().generation) return Promise.reject(error);
    return api.request(config);
  } catch (refreshError) { return Promise.reject(refreshError); }
});
export function useAuth() {
  const store = useAuthStore();
  return { ...store, isAuthenticated: Boolean(store.token), signIn: (username, password) => store.authenticate('signin', { username, password }), signUp: (username, email, password, name) => store.authenticate('signup', { username, email, password, name }) };
}
