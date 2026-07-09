// Petit magasin de messages internes (remplace les alert() du navigateur).
let notices = [];
const subs = new Set();
const emit = () => { for (const fn of subs) fn(notices); };

/** Affiche un message dans l'app (type: 'error' | 'info' | 'success'). */
export function notify(message, type = 'error', ms = 5000) {
  const id = `${Date.now()}-${Math.random()}`;
  notices = [...notices, { id, message: String(message || ''), type }];
  emit();
  if (ms > 0) setTimeout(() => dismissNotice(id), ms);
  return id;
}
export function dismissNotice(id) { notices = notices.filter((n) => n.id !== id); emit(); }
export function subscribeNotices(fn) { subs.add(fn); fn(notices); return () => subs.delete(fn); }
