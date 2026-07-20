import { useState, useEffect } from 'react';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';
import Avatar from './Avatar.jsx';
import { api } from '../api.js';

/** Transférer un message vers un salon ou un contact.
 *  onSend({ kind: 'channel' | 'dm', id, name }) est appelé au choix. */
export default function ForwardModal({ message, onSend, onClose }) {
  const [q, setQ] = useState('');
  const [contacts, setContacts] = useState([]);
  const [results, setResults] = useState(null); // null = pas de recherche en cours
  const [sentTo, setSentTo] = useState(null);

  useEffect(() => { api('/friends').then((d) => setContacts(d.friends || [])).catch(() => {}); }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) { setResults(null); return; }
    const t = setTimeout(() => {
      api(`/search/quick?q=${encodeURIComponent(term)}`)
        .then((d) => setResults({ channels: (d.channels || []).filter((c) => c.type === 'text'), people: d.people || [] }))
        .catch(() => setResults({ channels: [], people: [] }));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const preview = (message.content || '').trim() || (message.attachment_url ? 'Pièce jointe' : 'Message');
  const channels = results ? results.channels : [];
  const people = results ? results.people : contacts;

  const doSend = (target) => {
    onSend(target);
    setSentTo(target.name);
    setTimeout(onClose, 950);
  };

  return (
    <Modal onClose={onClose} className="modal-forward">
      <h2><Icon name="share" /> Transférer le message</h2>
      <div className="forward-preview">{preview}</div>

      {sentTo ? (
        <div className="forward-sent"><Icon name="circle-check" /> Transféré à {sentTo}.</div>
      ) : (
        <>
          <input className="forward-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un salon ou un contact…" />
          <div className="forward-list">
            {channels.length > 0 && <div className="forward-group">Salons</div>}
            {channels.map((c) => (
              <button key={`c${c.id}`} className="forward-row" onClick={() => doSend({ kind: 'channel', id: c.id, name: c.name })}>
                <span className="forward-ico"><Icon name="align-left" /></span>
                <span className="forward-row-main">
                  <span className="forward-row-name">{c.name}</span>
                  <span className="forward-row-sub">{c.server_name}</span>
                </span>
              </button>
            ))}
            {people.length > 0 && <div className="forward-group">{results ? 'Personnes' : 'Vos contacts'}</div>}
            {people.map((p) => (
              <button key={`p${p.id}`} className="forward-row" onClick={() => doSend({ kind: 'dm', id: p.id, name: p.display_name })}>
                <Avatar user={p} size={28} />
                <span className="forward-row-main">
                  <span className="forward-row-name">{p.display_name}</span>
                  <span className="forward-row-sub">@{p.username}</span>
                </span>
              </button>
            ))}
            {channels.length === 0 && people.length === 0 && (
              <div className="forward-empty">{results ? 'Aucune destination trouvée.' : 'Aucun contact pour l’instant. Recherchez un salon ci-dessus.'}</div>
            )}
          </div>
        </>
      )}

      <div className="modal-actions"><button className="btn btn-ghost" onClick={onClose}>Fermer</button></div>
    </Modal>
  );
}
