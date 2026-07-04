import { useState } from 'react';
import { api } from '../api.js';

function untilTomorrow9() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return Math.floor((d.getTime() - Date.now()) / 1000);
}

const OPTIONS = [
  { label: 'Enregistrer (sans rappel)', secs: 0 },
  { label: '⏰ Dans 20 min', secs: 1200 },
  { label: '⏰ Dans 1 heure', secs: 3600 },
  { label: '⏰ Dans 3 heures', secs: 10800 },
  { label: '⏰ Demain 9 h', secs: null }, // calculé
];

/** Bouton « enregistrer / me rappeler ce message ». */
export default function SaveButton({ content, attachmentUrl, authorName, source }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState('');

  async function save(secs) {
    const remindInSeconds = secs === null ? untilTomorrow9() : secs;
    try {
      await api('/saved', {
        method: 'POST',
        body: { content, attachment_url: attachmentUrl, author_name: authorName, source, remindInSeconds },
      });
      setDone(remindInSeconds > 0 ? '⏰ Rappel programmé !' : '🔖 Enregistré !');
      setTimeout(() => { setOpen(false); setDone(''); }, 1200);
    } catch {
      setDone('Erreur');
      setTimeout(() => setDone(''), 1200);
    }
  }

  return (
    <span className="save-wrap">
      <button title="Enregistrer / Me le rappeler" onClick={() => setOpen((v) => !v)}>🔖</button>
      {open && (
        <div className="save-pop">
          {done ? (
            <div className="save-done">{done}</div>
          ) : (
            OPTIONS.map((o) => (
              <button key={o.label} onClick={() => save(o.secs)}>{o.label}</button>
            ))
          )}
        </div>
      )}
    </span>
  );
}
