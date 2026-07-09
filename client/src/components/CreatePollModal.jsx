import { useState } from 'react';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';
import { api } from '../api.js';

const DURATIONS = [
  { h: 0, label: 'Pas de limite' },
  { h: 1, label: '1 heure' },
  { h: 24, label: '1 jour' },
  { h: 72, label: '3 jours' },
  { h: 168, label: '1 semaine' },
];

/** Créer un sondage à publier dans un salon. */
export default function CreatePollModal({ channelId, onClose }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multi, setMulti] = useState(false);
  const [durationHours, setDurationHours] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setOpt = (i, v) => setOptions((o) => o.map((x, k) => (k === i ? v : x)));
  const addOpt = () => setOptions((o) => (o.length < 10 ? [...o, ''] : o));
  const removeOpt = (i) => setOptions((o) => (o.length > 2 ? o.filter((_, k) => k !== i) : o));

  async function submit() {
    setError('');
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q) { setError('Ajoutez une question.'); return; }
    if (opts.length < 2) { setError('Ajoutez au moins deux options.'); return; }
    setBusy(true);
    try {
      await api(`/channels/${channelId}/polls`, { method: 'POST', body: { question: q, options: opts, multi, durationHours } });
      onClose();
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return (
    <Modal onClose={onClose} className="modal-poll">
      <h2><Icon name="chart-simple" /> Nouveau sondage</h2>
      <p className="modal-sub">Posez une question à votre serveur. Chacun pourra voter.</p>

      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label>Question</label>
        <input autoFocus value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="ex. On se voit quel jour cette semaine ?" maxLength={200} />
      </div>

      <div className="field">
        <label>Options</label>
        <div className="poll-opt-list">
          {options.map((o, i) => (
            <div className="poll-opt-row" key={i}>
              <input value={o} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} maxLength={100} />
              {options.length > 2 && <button type="button" title="Retirer" onClick={() => removeOpt(i)}><Icon name="xmark" /></button>}
            </div>
          ))}
        </div>
        {options.length < 10 && <button type="button" className="poll-add-opt" onClick={addOpt}><Icon name="plus" /> Ajouter une option</button>}
      </div>

      <div className="settings-two">
        <label className="poll-check-row">
          <input type="checkbox" checked={multi} onChange={(e) => setMulti(e.target.checked)} />
          <span>Autoriser plusieurs choix</span>
        </label>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Durée</label>
          <select value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))}>
            {DURATIONS.map((d) => <option key={d.h} value={d.h}>{d.label}</option>)}
          </select>
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn" onClick={submit} disabled={busy}>{busy ? 'Publication…' : 'Publier le sondage'}</button>
      </div>
    </Modal>
  );
}
