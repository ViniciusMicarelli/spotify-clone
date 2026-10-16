import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { PersistentMap, transaction } from './store.js';

export const usersDB = new PersistentMap('users', [['1', {
  id: '1', username: 'demo_user', email: 'demo@spotify-clone.com', name: 'Demo User', role: 'user', password: bcrypt.hashSync('password123', 10)
}]]);
export const publicUser = ({ password, ...user }) => user;
export function createUser({ username, email, password, name } = {}) {
  if (typeof username !== 'string' || !username.trim() || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || password.length < 8 || password.length > 72) {
    throw Object.assign(new Error('Informe usuário, email válido e senha de 8 a 72 caracteres.'), { status: 400 });
  }
  return transaction(() => {
  if ([...usersDB.values()].some(user => user.username.toLowerCase() === username.trim().toLowerCase() || user.email.toLowerCase() === email.trim().toLowerCase())) {
    throw Object.assign(new Error('Usuário ou email já cadastrado.'), { status: 409 });
  }
  const user = { id: randomUUID(), username: username.trim(), email: email.trim().toLowerCase(), name: typeof name === 'string' && name.trim() ? name.trim() : username.trim(), role: 'user', password: bcrypt.hashSync(password, 10) };
  usersDB.set(user.id, user);
  return user;
  });
}
