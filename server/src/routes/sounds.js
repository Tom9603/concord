import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

const isMember = (serverId, userId) =>
  !!db.prepare('SELECT 1 FROM server_members WHERE server_id = ? AND user_id = ?').get(serverId, userId);

/** Sons personnalisés d'un serveur. */
router.get('/:serverId', (req, res) => {
  if (!isMember(req.params.serverId, req.userId)) return res.status(403).json({ error: 'Non membre' });
  const items = db.prepare('SELECT * FROM sounds WHERE server_id = ? ORDER BY id ASC').all(req.params.serverId);
  res.json({ items });
});

/** Ajouter un son (fichier déjà uploadé -> url /uploads/...). */
router.post('/:serverId', (req, res) => {
  if (!isMember(req.params.serverId, req.userId)) return res.status(403).json({ error: 'Non membre' });
  const name = (req.body?.name || '').trim().slice(0, 40) || 'Son';
  const url = req.body?.url || '';
  if (!url.startsWith('/uploads/')) return res.status(400).json({ error: 'Fichier son invalide' });
  const count = db.prepare('SELECT COUNT(*) AS n FROM sounds WHERE server_id = ?').get(req.params.serverId).n;
  if (count >= 30) return res.status(400).json({ error: 'Limite de 30 sons atteinte' });
  const info = db.prepare('INSERT INTO sounds (server_id, name, url) VALUES (?, ?, ?)').run(req.params.serverId, name, url);
  res.json({ item: db.prepare('SELECT * FROM sounds WHERE id = ?').get(info.lastInsertRowid) });
});

/** Supprimer un son. */
router.delete('/:serverId/:id', (req, res) => {
  if (!isMember(req.params.serverId, req.userId)) return res.status(403).json({ error: 'Non membre' });
  db.prepare('DELETE FROM sounds WHERE id = ? AND server_id = ?').run(req.params.id, req.params.serverId);
  res.json({ ok: true });
});

export default router;
