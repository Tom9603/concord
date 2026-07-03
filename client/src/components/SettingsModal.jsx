import { useState } from 'react';
import Modal from './Modal.jsx';
import Avatar from './Avatar.jsx';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const COLORS = ['#5865F2', '#EB459E', '#57F287', '#FAA61A', '#ED4245', '#3498DB', '#9B59B6', '#14b8a6', '#e67e22'];
const STATUSES = [
  { value: 'online', label: '🟢 En ligne' },
  { value: 'idle', label: '🌙 Absent' },
  { value: 'dnd', label: '⛔ Ne pas déranger' },
  { value: 'invisible', label: '⚪ Invisible' },
];

/** Personnalisation du profil : nom affiché, avatar (couleur ou image), statut, bio. */
export default function SettingsModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user.display_name);
  const [avatarColor, setAvatarColor] = useState(user.avatar_color);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [about, setAbout] = useState(user.about || '');
  const [status, setStatus] = useState(user.status);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const preview = { display_name: displayName, avatar_color: avatarColor, avatar_url: avatarUrl, username: user.username };

  function onPickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      setError('Image trop lourde (1,5 Mo max).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result);
    reader.readAsDataURL(file);
  }

  async function save() {
    setError('');
    setBusy(true);
    try {
      const { user: updated } = await api('/users/me', {
        method: 'PATCH',
        body: {
          display_name: displayName,
          avatar_color: avatarColor,
          avatar_url: avatarUrl || null,
          about,
          status,
        },
      });
      updateUser(updated);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>Personnaliser mon profil</h2>
      <p className="modal-sub">Ces informations sont visibles par les autres membres.</p>

      {error && <div className="error-msg">{error}</div>}

      <div className="profile-preview">
        <Avatar user={preview} size={64} status={status} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{displayName || user.username}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>@{user.username}</div>
        </div>
      </div>

      <div className="field">
        <label>Nom affiché</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>

      <div className="field">
        <label>Couleur d’avatar</label>
        <div className="color-swatches">
          {COLORS.map((c) => (
            <div
              key={c}
              className={`color-swatch ${c === avatarColor ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setAvatarColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <label>Image d’avatar (optionnel)</label>
        <input type="file" accept="image/*" onChange={onPickImage} />
        {avatarUrl && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: 'auto', padding: '6px 12px', marginTop: 8, fontSize: 13 }}
            onClick={() => setAvatarUrl('')}
          >
            Retirer l’image
          </button>
        )}
      </div>

      <div className="field">
        <label>Statut</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>À propos de moi</label>
        <textarea rows={3} maxLength={300} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Parle un peu de toi…" />
      </div>

      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn" onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
      </div>
    </Modal>
  );
}
