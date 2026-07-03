import db from './db.js';

/** Catalogue des permissions gérables via les rôles. */
export const PERMISSIONS = {
  MANAGE_CHANNELS: 'Gérer les salons',
  MANAGE_ROLES: 'Gérer les rôles',
  KICK_MEMBERS: 'Expulser des membres',
  MANAGE_SERVER: 'Modifier le serveur',
};

export const PERMISSION_KEYS = Object.keys(PERMISSIONS);

/** Nettoie une liste de permissions reçue du client (ne garde que les clés valides). */
export function sanitizePermissions(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((p) => PERMISSION_KEYS.includes(p)))];
}

/**
 * Ensemble des permissions effectives d'un membre.
 * Le propriétaire du serveur a toutes les permissions.
 */
export function memberPermissions(serverId, userId) {
  const server = db.prepare('SELECT owner_id FROM servers WHERE id = ?').get(serverId);
  if (!server) return new Set();
  if (server.owner_id === userId) return new Set(PERMISSION_KEYS);

  const rows = db.prepare(`
    SELECT r.permissions FROM member_roles mr
    JOIN roles r ON r.id = mr.role_id
    WHERE mr.server_id = ? AND mr.user_id = ?
  `).all(serverId, userId);

  const set = new Set();
  for (const row of rows) {
    try {
      for (const p of JSON.parse(row.permissions)) set.add(p);
    } catch {
      /* permissions mal formées : ignorées */
    }
  }
  return set;
}

/** Le membre est-il propriétaire du serveur ? */
export function isOwner(serverId, userId) {
  const server = db.prepare('SELECT owner_id FROM servers WHERE id = ?').get(serverId);
  return !!server && server.owner_id === userId;
}

/** Le membre a-t-il une permission précise (le propriétaire l'a toujours) ? */
export function hasPermission(serverId, userId, key) {
  return memberPermissions(serverId, userId).has(key);
}
