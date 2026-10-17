import jwt from 'jsonwebtoken';
import { usersDB } from '../data/users.js';
import { JWT_SECRET, sessionsDB } from '../data/sessions.js';
export { JWT_SECRET };
export default function authMiddleware(req, res, next) {
  const match = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ error: 'Token de autenticação obrigatório.' });
  try {
    const decoded = jwt.verify(match[1], JWT_SECRET, { issuer: 'spotify-clone', algorithms: ['HS256'] });
    const session = typeof decoded.sid === 'string' && sessionsDB.get(decoded.sid);
    const user = usersDB.get(decoded.userId);
    if (decoded.kind !== 'access' || !user || !session || session.userId !== user.id || session.revoked || session.expiresAt <= Date.now()) return res.status(401).json({ error: 'Sessão inválida ou encerrada.' });
    req.userId = user.id;
    req.sessionId = session.id;
    req.user = { id: user.id, role: user.role };
    next();
  } catch { res.status(401).json({ error: 'Token inválido ou expirado.' }); }
}
