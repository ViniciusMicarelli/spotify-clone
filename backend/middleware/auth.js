import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { PersistentMap, transaction } from '../data/store.js';
import { usersDB } from '../data/users.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) throw new Error('JWT_SECRET é obrigatório em produção.');
const settings = new PersistentMap('settings');
transaction(() => {
  if (!process.env.JWT_SECRET && !settings.has('jwtSecret')) settings.set('jwtSecret', randomBytes(32).toString('hex'));
});
export const JWT_SECRET = process.env.JWT_SECRET || settings.get('jwtSecret');
export default function authMiddleware(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ error: 'Token de autenticação obrigatório.' });
  try {
    const decoded = jwt.verify(match[1], JWT_SECRET, { issuer: 'spotify-clone', algorithms: ['HS256'] });
    const user = usersDB.get(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });
    req.userId = user.id;
    req.user = { id: user.id, role: user.role };
    next();
  } catch { res.status(401).json({ error: 'Token inválido ou expirado.' }); }
}
