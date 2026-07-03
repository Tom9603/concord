import { Router } from 'express';
import db from '../db.js';
import { hashPassword, verifyPassword, signToken, authMiddleware, publicUser } from '../auth.js';

const router = Router();

const AVATAR_COLORS = ['#5865F2', '#EB459E', '#57F287', '#FAA61A', '#ED4245', '#3498DB', '#9B59B6'];
const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

router.post('/register', (req, res) => {
  const { username, password, display_name } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Nom d’utilisateur et mot de passe requis' });
  if (username.trim().length < 3) return res.status(400).json({ error: 'Nom d’utilisateur trop court (3 caractères min.)' });
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 caractères min.)' });

  const clean = username.trim();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(clean);
  if (existing) return res.status(409).json({ error: 'Ce nom d’utilisateur est déjà pris' });

  const info = db.prepare(
    'INSERT INTO users (username, password_hash, display_name, avatar_color) VALUES (?, ?, ?, ?)'
  ).run(clean, hashPassword(password), (display_name || '').trim() || clean, randomColor());

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get((username || '').trim());
  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ user: publicUser(user) });
});

export default router;
