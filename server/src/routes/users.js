import { Router } from 'express';
import db from '../db.js';
import { authMiddleware, publicUser } from '../auth.js';

const router = Router();
router.use(authMiddleware);

const STATUSES = ['online', 'idle', 'dnd', 'invisible'];

/** Met à jour le profil de l'utilisateur connecté (personnalisation). */
router.patch('/me', (req, res) => {
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!current) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const { display_name, avatar_color, avatar_url, about, status } = req.body || {};

  const nextName = (display_name ?? '').toString().trim() || current.display_name;
  const nextColor = /^#[0-9a-fA-F]{6}$/.test(avatar_color || '') ? avatar_color : current.avatar_color;
  const nextAvatar = avatar_url === undefined ? current.avatar_url : (avatar_url || null);
  const nextAbout = about === undefined ? current.about : String(about).slice(0, 300);
  const nextStatus = STATUSES.includes(status) ? status : current.status;

  db.prepare(
    'UPDATE users SET display_name = ?, avatar_color = ?, avatar_url = ?, about = ?, status = ? WHERE id = ?'
  ).run(nextName, nextColor, nextAvatar, nextAbout, nextStatus, req.userId);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: publicUser(user) });
});

/** Profil public d'un autre utilisateur. */
router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ user: publicUser(user) });
});

export default router;
