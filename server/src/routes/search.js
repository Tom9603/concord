import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../auth.js';
import { canAccessChannel } from '../permissions.js';

const router = Router();
router.use(authMiddleware);

const LIMIT = 6; // par catégorie : la recherche rapide doit rester lisible

/**
 * Recherche rapide (raccourci Ctrl/Cmd + K).
 * Renvoie de quoi naviguer : serveurs, salons, personnes, et quelques messages.
 * Tout est filtré sur ce que l'utilisateur a le droit de voir.
 */
router.get('/quick', (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (q.length < 1) return res.json({ servers: [], channels: [], people: [], messages: [] });
  const like = `%${q}%`;
  const me = req.userId;

  const servers = db.prepare(`
    SELECT s.id, s.name, s.icon_url, s.icon_color
    FROM servers s JOIN server_members sm ON sm.server_id = s.id
    WHERE sm.user_id = ? AND s.name LIKE ?
    ORDER BY s.name LIMIT ?
  `).all(me, like, LIMIT);

  // On élargit puis on filtre : un salon privé ne doit jamais apparaître ici.
  const channels = db.prepare(`
    SELECT c.id, c.name, c.type, c.server_id, s.name AS server_name
    FROM channels c
    JOIN servers s ON s.id = c.server_id
    JOIN server_members sm ON sm.server_id = s.id AND sm.user_id = ?
    WHERE c.name LIKE ?
    ORDER BY c.name LIMIT ?
  `).all(me, like, LIMIT * 3)
    .filter((c) => canAccessChannel(c.id, me))
    .slice(0, LIMIT);

  // Personnes : contacts acceptés + celles avec qui j'ai déjà échangé en privé.
  const people = db.prepare(`
    SELECT DISTINCT u.id, u.username, u.display_name, u.avatar_url, u.avatar_color
    FROM users u
    WHERE u.id != ?
      AND (u.display_name LIKE ? OR u.username LIKE ?)
      AND (
        EXISTS (SELECT 1 FROM friendships f WHERE f.status = 'accepted'
                AND ((f.requester_id = ? AND f.addressee_id = u.id) OR (f.requester_id = u.id AND f.addressee_id = ?)))
        OR EXISTS (SELECT 1 FROM dm_messages d
                   WHERE (d.sender_id = ? AND d.recipient_id = u.id) OR (d.sender_id = u.id AND d.recipient_id = ?))
      )
    ORDER BY u.display_name LIMIT ?
  `).all(me, like, like, me, me, me, me, LIMIT);

  const messages = q.length < 2 ? [] : db.prepare(`
    SELECT m.id, m.content, m.created_at, m.channel_id, c.name AS channel_name,
           c.server_id, s.name AS server_name, u.display_name
    FROM messages m
    JOIN channels c ON c.id = m.channel_id
    JOIN servers s ON s.id = c.server_id
    JOIN server_members sm ON sm.server_id = s.id AND sm.user_id = ?
    JOIN users u ON u.id = m.user_id
    WHERE m.deleted = 0 AND m.content LIKE ?
    ORDER BY m.id DESC LIMIT ?
  `).all(me, like, LIMIT * 3)
    .filter((m) => canAccessChannel(m.channel_id, me))
    .slice(0, LIMIT);

  res.json({ servers, channels, people, messages });
});

export default router;
