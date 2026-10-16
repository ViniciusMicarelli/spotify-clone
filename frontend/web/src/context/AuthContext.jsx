import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api/v1' });
export const useAuthStore = create(persist((set, get) => ({
  user: null, token: null,
  async authenticate(path, fields) {
    try {
      const { data } = await api.post(`/auth/${path}`, fields);
      set({ user: data.user, token: data.token });
      return { success: true };
    } catch (error) { return { success: false, error: error.response?.data?.error || 'Não foi possível conectar à API.' }; }
  },
  async refreshUser() {
    const token = get().token;
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      if (get().token === token) set({ user: data.user });
    } catch { /* The response interceptor clears an invalid session. */ }
  },
  async updateProfile(fields) {
    const { token, user } = get();
    if (!token || !user) return { success: false, error: 'Entre para editar seu perfil.' };
    try {
      const { data } = await api.put(`/users/${user.id}`, fields);
      if (get().token !== token) return { success: false, error: 'A sessão foi alterada.' };
      set({ user: data.data });
      return { success: true };
    } catch (error) { return { success: false, error: error.response?.data?.error || 'Não foi possível salvar o perfil.' }; }
  },
  signOut() { set({ user: null, token: null }); }
}), { name: 'spotify-clone-auth' }));
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(response => response, error => {
  const store = useAuthStore.getState();
  if (error.response?.status === 401 && store.token && error.config?.headers?.Authorization === `Bearer ${store.token}` && !error.config?.url?.includes('/auth/signin')) store.signOut();
  return Promise.reject(error);
});
export function useAuth() {
  const store = useAuthStore();
  return { ...store, isAuthenticated: Boolean(store.token), signIn: (username, password) => store.authenticate('signin', { username, password }), signUp: (username, email, password, name) => store.authenticate('signup', { username, email, password, name }) };
}
