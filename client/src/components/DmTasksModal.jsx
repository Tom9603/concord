import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';
import Avatar from './Avatar.jsx';
import { api } from '../api.js';

const STATUS = { todo: 'À faire', doing: 'En cours', done: 'Terminé' };

/** Tâches partagées avec un correspondant (créées par l'un pour l'autre). */
export default function DmTasksModal({ peer, currentUser, onClose, onNewTask }) {
  const [tasks, setTasks] = useState(null);

  useEffect(() => {
    api('/tasks').then(({ tasks }) => {
      const mine = (tasks || []).filter((t) =>
        (t.creator_id === currentUser.id && t.assignee_id === peer.id) ||
        (t.creator_id === peer.id && t.assignee_id === currentUser.id));
      setTasks(mine);
    }).catch(() => setTasks([]));
  }, [peer.id, currentUser.id]);

  return (
    <Modal onClose={onClose} className="modal-dmtasks">
      <div className="dmt-head">
        <h2><Icon name="list-check" /> Tâches avec {peer.display_name}</h2>
        <button className="btn" style={{ width: 'auto', padding: '7px 14px', fontSize: 13 }} onClick={() => { onNewTask?.(); onClose(); }}>
          <Icon name="plus" /> Nouvelle tâche
        </button>
      </div>

      {tasks === null && <p className="modal-sub">Chargement…</p>}
      {tasks && tasks.length === 0 && (
        <p className="tasks-empty">Aucune tâche partagée avec {peer.display_name}. Créez-en une pour vous répartir le travail.</p>
      )}

      {tasks && tasks.length > 0 && (
        <div className="dmt-list">
          {tasks.map((t) => (
            <div className={`dmt-item ${t.status === 'done' ? 'is-done' : ''}`} key={t.id}>
              <span className={`dmt-dot ${t.status}`} />
              <div className="dmt-main">
                <div className="dmt-title">{t.title}</div>
                <div className="dmt-meta">
                  <span>{STATUS[t.status] || t.status}</span>
                  <span className="dmt-sep">·</span>
                  <span className="dmt-who">
                    {t.creator_id === currentUser.id ? 'Vous → ' : `${t.creator_name} → `}
                    {t.assignee_id === currentUser.id ? 'vous' : peer.display_name}
                  </span>
                </div>
              </div>
              <Avatar user={{ display_name: t.assignee_name, avatar_color: t.assignee_color, avatar_url: t.assignee_avatar }} size={26} />
            </div>
          ))}
        </div>
      )}

      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  );
}
