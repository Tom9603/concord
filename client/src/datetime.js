// Formatage de la date/heure des messages.
// Les horodatages viennent de SQLite en UTC ("YYYY-MM-DD HH:MM:SS").

// Format d'heure choisi par l'utilisateur (12 h ou 24 h), lu depuis les
// préférences d'apparence et mis en cache pour ne pas toucher le stockage à
// chaque message affiché. `refreshClockPref()` recharge après un changement.
let clock12 = readClock12();
function readClock12() {
  try { return JSON.parse(localStorage.getItem('pulsar-appearance') || '{}').clock === '12'; }
  catch { return false; }
}
export function refreshClockPref() { clock12 = readClock12(); }

function parseTs(ts) {
  if (ts instanceof Date) return ts;
  return new Date(String(ts).replace(' ', 'T') + 'Z');
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Heure seule : "14:30" (24 h) ou "2:30 PM" (12 h). */
export function formatTime(ts) {
  return parseTs(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: clock12 });
}

/** Heure + date relative : "14:30", "Hier 14:30", "Avant-hier 14:30",
 *  puis "07/07/2026 14:30" au-delà de deux jours. */
export function formatTimeDate(ts) {
  const d = parseTs(ts);
  const time = formatTime(d);
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (days <= 0) return time;
  if (days === 1) return `Hier ${time}`;
  if (days === 2) return `Avant-hier ${time}`;
  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${date} ${time}`;
}
