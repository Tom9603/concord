import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

const TYPES = ['bug', 'suggestion', 'autre'];

/** Envoyer un retour (bug, suggestion…) avec captures éventuelles. */
router.post('/', (req, res) => {
  const b = req.body || {};
  const type = TYPES.includes(b.type) ? b.type : 'suggestion';
  const message = (b.message || '').toString().trim();
  if (!message) return res.status(400).json({ error: 'Merci de décrire votre retour.' });

  const subject = (b.subject || '').toString().slice(0, 160) || null;
  const area = (b.area || '').toString().slice(0, 120) || null;
  const shots = Array.isArray(b.screenshots)
    ? b.screenshots.filter((u) => typeof u === 'string' && u.startsWith('/uploads/')).slice(0, 6)
    : [];

  db.prepare('INSERT INTO feedback (user_id, type, subject, message, area, screenshots) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.userId, type, subject, message.slice(0, 4000), area, JSON.stringify(shots));

  res.json({ ok: true });
});

export default router;
