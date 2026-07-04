import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

/** Liste des messages express de l'utilisateur. */
router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM quick_messages WHERE user_id = ? ORDER BY id ASC').all(req.userId);
  res.json({ items });
});

/** Ajouter un message express. */
router.post('/', (req, res) => {
  const text = (req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Texte requis' });
  const count = db.prepare('SELECT COUNT(*) AS n FROM quick_messages WHERE user_id = ?').get(req.userId).n;
  if (count >= 50) return res.status(400).json({ error: 'Limite de 50 messages express atteinte' });
  const info = db.prepare('INSERT INTO quick_messages (user_id, text) VALUES (?, ?)').run(req.userId, text.slice(0, 500));
  res.json({ item: db.prepare('SELECT * FROM quick_messages WHERE id = ?').get(info.lastInsertRowid) });
});

/** Supprimer un message express. */
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM quick_messages WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ ok: true });
});

export default router;
