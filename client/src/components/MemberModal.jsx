import { useState } from 'react';
import Modal from './Modal.jsx';
import Avatar from './Avatar.jsx';
import { api } from '../api.js';

/** Fiche d'un membre : profil, rôles (attribution), expulsion, message privé. */
export default function MemberModal({ member, roles, server, canManageRoles, canKick, currentUserId, onClose, onChanged, onMessage }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const roleIds = new Set(member.role_ids || []);
  const isTargetOwner = member.id === server.owner_id;

  async function toggleRole(role) {
    setBusy(true); setError('');
    try {
      if (roleIds.has(role.id)) {
        await api(`/servers/${server.id}/members/${member.id}/roles/${role.id}`, { method: 'DELETE' });
      } else {
        await api(`/servers/${server.id}/members/${member.id}/roles`, { method: 'POST', body: { roleId: role.id } });
      }
      await onChanged();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function kick() {
    if (!confirm(`Expulser ${member.display_name} du serveur ?`)) return;
    setBusy(true); setError('');
    try {
      await api(`/servers/${server.id}/members/${member.id}`, { method: 'DELETE' });
      await onChanged();
      onClose();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <Modal onClose={onClose}>
      <div className="profile-preview">
        <Avatar user={member} size={64} status={member.status} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {member.display_name}
            {isTargetOwner && <span title="Propriétaire"> 👑</span>}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>@{member.username}</div>
        </div>
      </div>

      {member.about && (
        <div className="field">
          <label>À propos</label>
          <p style={{ fontSize: 14, color: 'var(--text)' }}>{member.about}</p>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {canManageRoles && (
        <div className="field">
          <label>Rôles</label>
          {roles.length === 0 && <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>Aucun rôle sur ce serveur.</p>}
          {roles.map((r) => (
            <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', textTransform: 'none', fontWeight: 400, color: 'var(--text)' }}>
              <input type="checkbox" checked={roleIds.has(r.id)} disabled={busy} onChange={() => toggleRole(r)} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: r.color }} />
              {r.name}
            </label>
          ))}
        </div>
      )}

      <div className="modal-actions">
        {member.id !== currentUserId && (
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => { onMessage(member); onClose(); }}>
            💬 Message privé
          </button>
        )}
        {canKick && !isTargetOwner && member.id !== currentUserId && (
          <button className="btn btn-danger" style={{ width: 'auto', padding: '8px 16px' }} onClick={kick} disabled={busy}>
            Expulser
          </button>
        )}
        <button className="btn" style={{ width: 'auto', padding: '8px 16px' }} onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  );
}
