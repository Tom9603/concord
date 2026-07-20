import { Router } from 'express';
import { authMiddleware } from '../auth.js';

const router = Router();
router.use(authMiddleware);

// Tenor API v2 (Google). L'ancienne v1 et la clé de démo publique ont été
// fermées par Google : il faut désormais une clé gratuite propre, fournie via
// la variable d'environnement TENOR_API_KEY (voir deploy/set-tenor-key.sh).
const KEY = process.env.TENOR_API_KEY || '';
const BASE = 'https://tenor.googleapis.com/v2';
const CLIENT = 'pulsar';

/** Recherche de GIF (ou sélection mise en avant si pas de recherche) via Tenor. */
router.get('/', async (req, res) => {
  if (!KEY) return res.json({ results: [], error: 'GIF non configurés sur ce serveur.' });

  const q = (req.query.q || '').toString().trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 24, 50);
  const common = `key=${KEY}&client_key=${CLIENT}&limit=${limit}`
    + '&contentfilter=medium&locale=fr_FR&media_filter=tinygif,mediumgif';
  const url = q
    ? `${BASE}/search?q=${encodeURIComponent(q)}&${common}`
    : `${BASE}/featured?${common}`;

  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await r.json();
    const results = (data.results || [])
      .map((g) => {
        const f = g.media_formats || {};
        const preview = f.tinygif?.url || f.nanogif?.url || f.mediumgif?.url;
        const full = f.mediumgif?.url || f.gif?.url || preview;
        return { id: g.id, preview, url: full, desc: g.content_description || '' };
      })
      .filter((x) => x.preview && x.url);
    res.json({ results });
  } catch {
    res.json({ results: [], error: 'GIF indisponibles pour le moment.' });
  }
});

export default router;
