import Avatar from './Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_LABEL = {
  online: 'En ligne',
  idle: 'Absent',
  dnd: 'Ne pas déranger',
  invisible: 'Invisible',
};

/** Panneau utilisateur en bas de la sidebar : avatar, pseudo, réglages, déconnexion. */
export default function UserPanel({ user, onOpenSettings }) {
  const { logout } = useAuth();
  return (
    <div className="user-panel">
      <Avatar user={user} size={32} status={user.status} />
      <div className="info">
        <div className="name">{user.display_name}</div>
        <div className="status-text">{STATUS_LABEL[user.status] || 'En ligne'}</div>
      </div>
      <button className="icon-btn" title="Paramètres du profil" onClick={onOpenSettings}>⚙</button>
      <button className="icon-btn" title="Se déconnecter" onClick={logout}>⏻</button>
    </div>
  );
}
