import { useEffect, useState, useCallback } from 'react';
import { api, mediaUrl, isAudio } from '../api.js';
import { getSocket } from '../socket.js';
import { renderRich } from '../richtext.jsx';

function reminderLabel(item) {
  if (!item.remind_at) return null;
  const diff = item.remind_at * 1000 - Date.now();
  const when = new Date(item.remind_at * 1000).toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  if (item.notified || diff <= 0) return `🔔 Rappel passé (${when})`;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `⏰ Rappel ${h > 0 ? `dans ${h} h ${m} min` : `dans ${m} min`} (${when})`;
}

const untilTomorrow9 = () => {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
  return Math.floor((d.getTime() - Date.now()) / 1000);
};

/** Espace personnel : messages enregistrés + rappels. */
export default function SavedPanel({ currentUser }) {
  const [items, setItems] = useState([]);
  const [menuFor, setMenuFor] = useState(null);

  const load = useCallback(() => { api('/saved').then(({ items }) => setItems(items)).catch(() => {}); }, []);

  useEffect(() => {
    load();
    const socket = getSocket();
    socket.on('reminder:due', load);
    return () => socket.off('reminder:due', load);
  }, [load]);

  const remove = async (id) => { await api(`/saved/${id}`, { method: 'DELETE' }); load(); };
  const setReminder = async (id, secs) => { await api(`/saved/${id}`, { method: 'PATCH', body: { remindInSeconds: secs } }); setMenuFor(null); load(); };

  return (
    <div className="main-content">
      <div className="content-header"><span>🔖 Sauvegardés & rappels</span></div>
      <div className="saved-body">
        {items.length === 0 && (
          <p className="saved-empty">
            Rien d’enregistré. Sur n’importe quel message, clique 🔖 pour le garder ici — et te le faire rappeler plus tard !
          </p>
        )}
        {items.map((it) => (
          <div className={`saved-item ${it.remind_at && !it.notified ? 'has-reminder' : ''}`} key={it.id}>
            <div className="saved-main">
              <div className="saved-meta">
                <strong>{it.author_name || 'Message'}</strong>
                {it.source ? <span> · {it.source}</span> : null}
              </div>
              {it.content && <div className="saved-text">{renderRich(it.content, currentUser)}</div>}
              {it.attachment_url && (isAudio(it.attachment_url)
                ? <audio className="msg-audio" controls src={mediaUrl(it.attachment_url)} />
                : <img className="saved-img" src={mediaUrl(it.attachment_url)} alt="" onClick={() => window.open(mediaUrl(it.attachment_url), '_blank')} />)}
              {reminderLabel(it) && <div className="saved-reminder">{reminderLabel(it)}</div>}
            </div>
            <div className="saved-actions">
              <button title="Programmer un rappel" onClick={() => setMenuFor(menuFor === it.id ? null : it.id)}>⏰</button>
              <button title="Supprimer" onClick={() => remove(it.id)}>🗑️</button>
              {menuFor === it.id && (
                <div className="save-pop">
                  <button onClick={() => setReminder(it.id, 3600)}>Dans 1 heure</button>
                  <button onClick={() => setReminder(it.id, 10800)}>Dans 3 heures</button>
                  <button onClick={() => setReminder(it.id, untilTomorrow9())}>Demain 9 h</button>
                  <button onClick={() => setReminder(it.id, 0)}>Retirer le rappel</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
