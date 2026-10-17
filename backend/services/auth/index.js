import express from 'express';
import bcrypt from 'bcryptjs';
import { usersDB as users, publicUser, createUser } from '../../data/users.js';
import { createSession, rotateSession, revokeSession } from '../../data/sessions.js';
import authMiddleware from '../../middleware/auth.js';
import { transaction } from '../../data/store.js';
export { users };
export const auth = express.Router();
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/auth' };
function readCookie(req) {
  const value = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('spotify_refresh='));
  try { return value ? decodeURIComponent(value.slice('spotify_refresh='.length)) : undefined; } catch { return undefined; }
}
function respond(res, session, status = 200) {
  res.cookie('spotify_refresh', session.refreshToken, { ...cookieOptions, maxAge: session.expiresAt - Date.now() });
  res.status(status).json({ user: session.user, token: session.token, expiresIn: session.expiresIn });
}
auth.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const origin = req.headers.origin;
  if (origin) {
    const configured = (process.env.FRONTEND_ORIGIN || '').split(',').map(value => value.trim()).filter(Boolean);
    let local = false;
    try { const url = new URL(origin); local = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname); } catch {}
    if (!local && origin !== `${req.protocol}://${req.get('host')}` && !configured.includes(origin)) return res.status(403).json({ error: 'Origem não autorizada.' });
  }
  next();
});
auth.post('/signup', (req, res, next) => {
  try { respond(res, transaction(() => { const user = createUser(req.body); revokeSession(readCookie(req)); return createSession(user); }), 201); }
  catch (error) { if (error.status) return res.status(error.status).json({ error: error.message }); next(error); }
});
auth.post('/signin', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = [...users.values()].find(user => typeof username === 'string' && user.username.toLowerCase() === username.trim().toLowerCase());
    if (!user || typeof password !== 'string' || !await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Credenciais inválidas.' });
    const previous = readCookie(req);
    const session = transaction(() => { if (previous) revokeSession(previous); return createSession(user); });
    respond(res, session);
  } catch (error) { next(error); }
});
auth.post('/refresh', (req, res) => {
  const session = rotateSession(readCookie(req));
  if (!session) { res.clearCookie('spotify_refresh', cookieOptions); return res.status(401).json({ error: 'Sessão expirada. Entre novamente.' }); }
  respond(res, session);
});
auth.post('/signout', (req, res) => {
  revokeSession(readCookie(req));
  res.clearCookie('spotify_refresh', cookieOptions);
  res.json({ success: true });
});
auth.get('/me', authMiddleware, (req, res) => res.json({ user: publicUser(users.get(req.userId)) }));
export default auth;
