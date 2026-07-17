/**
 * Brouillons de messages.
 *
 * Un message commencé puis abandonné pour aller voir ailleurs doit être
 * retrouvé intact au retour, y compris après un rechargement de la page.
 * Chaque conversation a sa propre clé (« channel:12 », « dm:4 »).
 */

const PREFIX = 'pulsar.draft.';
const MAX_AGE = 14 * 86400_000; // au-delà, le brouillon n'a plus d'intérêt

const key = (scope) => PREFIX + scope;

/** Brouillon enregistré pour cette conversation (chaîne vide si aucun). */
export function loadDraft(scope) {
  if (!scope) return '';
  try {
    const raw = localStorage.getItem(key(scope));
    if (!raw) return '';
    const { text, at } = JSON.parse(raw);
    if (Date.now() - at > MAX_AGE) { localStorage.removeItem(key(scope)); return ''; }
    return text || '';
  } catch {
    return '';
  }
}

/** Enregistre (ou efface si vide) le brouillon de cette conversation. */
export function saveDraft(scope, text) {
  if (!scope) return;
  try {
    if (!text) localStorage.removeItem(key(scope));
    else localStorage.setItem(key(scope), JSON.stringify({ text, at: Date.now() }));
  } catch { /* stockage plein ou refusé : le brouillon n'est pas vital */ }
}

export const clearDraft = (scope) => saveDraft(scope, '');

/** Cette conversation a-t-elle un brouillon en attente ? (pastille dans les listes) */
export const hasDraft = (scope) => loadDraft(scope).length > 0;

/** Ménage au démarrage : on jette les brouillons trop vieux. */
export function pruneDrafts() {
  try {
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith(PREFIX)) continue;
      const { at } = JSON.parse(localStorage.getItem(k) || '{}');
      if (!at || Date.now() - at > MAX_AGE) localStorage.removeItem(k);
    }
  } catch { /* sans conséquence */ }
}
