import { randomBytes, randomUUID, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { PersistentMap, transaction } from './store.js';
import { usersDB, publicUser } from './users.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) throw new Error('JWT_SECRET é obrigatório em produção.');
const settings = new PersistentMap('settings');
transaction(() => { if (!process.env.JWT_SECRET && !settings.has('jwtSecret')) settings.set('jwtSecret', randomBytes(32).toString('hex')); });
export const JWT_SECRET = process.env.JWT_SECRET || settings.get('jwtSecret');
export const sessionsDB = new PersistentMap('sessions');
export const refreshTokensDB = new PersistentMap('refreshTokens');
export const ACCESS_TTL = Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900);
if (!Number.isInteger(ACCESS_TTL) || ACCESS_TTL < 1) throw new Error('ACCESS_TOKEN_TTL_SECONDS deve ser um inteiro positivo.');
const REFRESH_TTL = 30 * 24 * 60 * 60 * 1000;
const hash = token => createHash('sha256').update(token).digest('hex');
function issue(user, session) {
  const refreshToken = randomBytes(48).toString('base64url');
  refreshTokensDB.set(hash(refreshToken), { sessionId: session.id, used: false, expiresAt: session.expiresAt });
  return { user: publicUser(user), token: jwt.sign({ userId: user.id, sid: session.id, kind: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TTL, issuer: 'spotify-clone', jwtid: randomUUID() }), refreshToken, expiresAt: session.expiresAt, expiresIn: ACCESS_TTL };
}
export function createSession(user) {
  return transaction(() => {
    // Expired families and their token hashes are no longer useful for replay detection.
    for (const [id, session] of sessionsDB) if (session.expiresAt <= Date.now()) sessionsDB.delete(id);
    for (const [id, token] of refreshTokensDB) if (token.expiresAt <= Date.now() || !sessionsDB.has(token.sessionId)) refreshTokensDB.delete(id);
    const session = { id: randomUUID(), userId: user.id, expiresAt: Date.now() + REFRESH_TTL, revoked: false };
    sessionsDB.set(session.id, session);
    return issue(user, session);
  });
}
export function rotateSession(refreshToken) {
  if (typeof refreshToken !== 'string' || refreshToken.length > 256) return null;
  return transaction(() => {
    const digest = hash(refreshToken);
    const record = refreshTokensDB.get(digest);
    if (!record) return null;
    const session = sessionsDB.get(record.sessionId);
    if (!session || session.revoked || session.expiresAt <= Date.now()) return null;
    if (record.used) { sessionsDB.set(session.id, { ...session, revoked: true }); return null; }
    const user = usersDB.get(session.userId);
    if (!user) { sessionsDB.set(session.id, { ...session, revoked: true }); return null; }
    refreshTokensDB.set(digest, { ...record, used: true });
    return issue(user, session);
  });
}
export function revokeSession(refreshToken) {
  if (typeof refreshToken !== 'string' || refreshToken.length > 256) return;
  transaction(() => {
    const record = refreshTokensDB.get(hash(refreshToken));
    const session = record && sessionsDB.get(record.sessionId);
    if (session) sessionsDB.set(session.id, { ...session, revoked: true });
  });
}
export function revokeUserSessions(userId) {
  for (const [id, session] of sessionsDB) if (session.userId === userId) {
    for (const [digest, token] of refreshTokensDB) if (token.sessionId === id) refreshTokensDB.delete(digest);
    sessionsDB.delete(id);
  }
}
