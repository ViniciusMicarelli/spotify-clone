import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { usersDB as users, publicUser, createUser } from '../../data/users.js';
export { users };
import authMiddleware, { JWT_SECRET } from '../../middleware/auth.js';

export const auth = express.Router();
const session = user => ({ user: publicUser(user), token: jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h', issuer: 'spotify-clone' }) });

auth.post('/signup', async (req, res, next) => {
  try {
    const user = createUser(req.body);
    res.status(201).json(session(user));
  } catch (error) { if (error.status) return res.status(error.status).json({ error: error.message }); next(error); }
});
auth.post('/signin', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = [...users.values()].find(user => typeof username === 'string' && user.username.toLowerCase() === username.trim().toLowerCase());
    if (!user || typeof password !== 'string' || !await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Credenciais inválidas.' });
    res.json(session(user));
  } catch (error) { if (error.status) return res.status(error.status).json({ error: error.message }); next(error); }
});
auth.get('/me', authMiddleware, (req, res) => {
  const user = users.get(req.userId);
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' });
  res.json({ user: publicUser(user) });
});
export default auth;
