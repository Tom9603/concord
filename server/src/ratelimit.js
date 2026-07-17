/**
 * Limitation de débit en mémoire (fenêtre glissante).
 *
 * Protège les points d'entrée sensibles (inscription, connexion, code de
 * confirmation, envoi de messages) contre le martèlement automatisé.
 * Volontairement sans dépendance ni base : Pulsar tourne sur un seul serveur,
 * et une limite en mémoire y est exacte tout en restant gratuite.
 */

const buckets = new Map(); // clé -> tableau d'horodatages (ms)

/** Adresse de l'appelant (Caddy place l'IP réelle dans X-Forwarded-For). */
export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'inconnu';
}

/**
 * Autorise une action, ou non.
 * @returns {{ok: true} | {ok: false, retryAfter: number}} retryAfter en secondes
 */
export function take(key, max, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true };
}

/** Efface le compteur (après une action légitime réussie, ex. connexion). */
export const reset = (key) => buckets.delete(key);

/**
 * Middleware Express prêt à l'emploi.
 * @param {string} name    nom du seau (isole les compteurs entre eux)
 * @param {number} max     nombre d'actions autorisées
 * @param {number} seconds durée de la fenêtre
 * @param {string} message message renvoyé une fois la limite atteinte
 */
export function limit(name, max, seconds, message) {
  return (req, res, next) => {
    const r = take(`${name}:${clientIp(req)}`, max, seconds * 1000);
    if (r.ok) return next();
    res.set('Retry-After', String(r.retryAfter));
    res.status(429).json({ error: message, retryAfter: r.retryAfter });
  };
}

// Ménage périodique : on jette les seaux vides pour ne pas grossir sans fin.
setInterval(() => {
  const now = Date.now();
  for (const [k, hits] of buckets) {
    if (!hits.length || now - hits[hits.length - 1] > 3600_000) buckets.delete(k);
  }
}, 600_000).unref();
