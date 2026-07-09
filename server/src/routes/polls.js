import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { canAccessChannel } from '../permissions.js';
import { getIO } from '../realtime.js';
import { pollObject } from '../socket.js';

const router = Router();
router.use(authMiddleware);

/** Voter (ou retirer son vote) sur un sondage. */
router.post('/:id/vote', (req, res) => {
  const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Sondage introuvable' });
  const channel = db.prepare('SELECT id, server_id FROM channels WHERE id = ?').get(poll.channel_id);
  if (!channel || !canAccessChannel(channel.id, req.userId)) return res.status(403).json({ error: 'Accès refusé' });
  if (poll.closes_at && poll.closes_at * 1000 < Date.now()) return res.status(400).json({ error: 'Ce sondage est clôturé' });

  let options = [];
  try { options = JSON.parse(poll.options); } catch { options = []; }
  const index = Number(req.body?.optionIndex);
  if (!Number.isInteger(index) || index < 0 || index >= options.length) return res.status(400).json({ error: 'Option invalide' });

  const existing = db.prepare('SELECT 1 FROM poll_votes WHERE poll_id = ? AND user_id = ? AND option_index = ?').get(poll.id, req.userId, index);
  if (existing) {
    // Reclique sur son choix : on retire le vote (toggle).
    db.prepare('DELETE FROM poll_votes WHERE poll_id = ? AND user_id = ? AND option_index = ?').run(poll.id, req.userId, index);
  } else {
    if (!poll.multi) db.prepare('DELETE FROM poll_votes WHERE poll_id = ? AND user_id = ?').run(poll.id, req.userId);
    db.prepare('INSERT INTO poll_votes (poll_id, user_id, option_index) VALUES (?, ?, ?)').run(poll.id, req.userId, index);
  }

  // Diffuse les nouveaux comptes (sans « mes votes », propre à chacun).
  getIO()?.to('server:' + channel.server_id).emit('poll:update', { channelId: channel.id, poll: pollObject(poll.id, null) });
  res.json({ poll: pollObject(poll.id, req.userId) });
});

export default router;
