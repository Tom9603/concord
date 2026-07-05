import { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';

/** Modale à deux onglets : créer un serveur OU rejoindre via un code d'invitation. */
export default function CreateServerModal({ onClose, onReady }) {
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (tab === 'create') {
        const { server } = await api('/servers', { method: 'POST', body: { name } });
        await onReady(server);
      } else {
        const { server } = await api('/servers/join', { method: 'POST', body: { invite_code: code } });
        await onReady(server);
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="tab-row">
        <button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>Créer un serveur</button>
        <button className={tab === 'join' ? 'active' : ''} onClick={() => setTab('join')}>Rejoindre</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={submit}>
        {tab === 'create' ? (
          <>
            <h2>Créez votre serveur</h2>
            <p className="modal-sub">Donnez-lui un nom, vous pourrez tout personnaliser ensuite.</p>
            <div className="field">
              <label>Nom du serveur</label>
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ma communauté" />
            </div>
          </>
        ) : (
          <>
            <h2>Rejoignez un serveur</h2>
            <p className="modal-sub">Collez un code d’invitation qu’un contact vous a partagé.</p>
            <div className="field">
              <label>Code d’invitation</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} autoFocus placeholder="ex. 0cd739d4" />
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn" disabled={busy}>{busy ? '…' : tab === 'create' ? 'Créer' : 'Rejoindre'}</button>
        </div>
      </form>
    </Modal>
  );
}
