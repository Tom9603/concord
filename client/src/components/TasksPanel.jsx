import { useState } from 'react';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';
import Segmented from './Segmented.jsx';
import { api, mediaUrl } from '../api.js';

const GROUPS = [
  { key: 'todo', label: 'À faire', icon: 'list-check' },
  { key: 'doing', label: 'En cours', icon: 'hourglass-half' },
  { key: 'done', label: 'Terminé', icon: 'circle-check' },
];
const PRIO = { high: { dot: '#ff453a', label: 'Haute' }, normal: { dot: '#0a84ff', label: 'Normale' }, low: { dot: '#8e8e93', label: 'Basse' } };

/** Colonnes de rangement personnel, de la plus urgente à la moins urgente. */
const PRIO_LANES = [
  { key: 'high', label: 'Haute', icon: 'fire', hint: 'À traiter en premier' },
  { key: 'normal', label: 'Normale', icon: 'equals', hint: 'Le rythme habituel' },
  { key: 'low', label: 'Basse', icon: 'mug-hot', hint: 'Quand vous aurez le temps' },
];

function dueLabel(epoch) {
  if (!epoch) return null;
  const d = new Date(epoch * 1000);
  const overdue = epoch * 1000 < Date.now();
  const txt = d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  return { txt, overdue };
}

/** Priorité affichée : la mienne si je l'ai rangée, sinon celle de la tâche. */
const effectivePriority = (t) => t.my_priority || t.priority || 'normal';

/**
 * Liste des tâches (assignées à moi ou créées par moi).
 * Deux lectures : par avancement, ou par priorité personnelle avec un
 * rangement au glisser-déposer.
 */
export default function TasksPanel({ tasks, currentUser, filter, onFilter, onToggle, onSetStatus, onEdit, onDelete, onNew, onRefresh }) {
  const [openDetails, setOpenDetails] = useState(() => new Set());
  const [view, setView] = useState('statut');
  const [dragId, setDragId] = useState(null);
  const [overLane, setOverLane] = useState(null);
  const [local, setLocal] = useState({}); // priorités posées en attendant la réponse du serveur

  const toggleDetail = (id) => setOpenDetails((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const shown = filter === 'mine'
    ? tasks.filter((t) => t.assignee_id === currentUser.id)
    : filter === 'assigned'
      ? tasks.filter((t) => t.creator_id === currentUser.id && t.assignee_id && t.assignee_id !== currentUser.id)
      : tasks;
  const openCount = tasks.filter((t) => t.status !== 'done' && t.assignee_id === currentUser.id).length;
  const assignedCount = tasks.filter((t) => t.creator_id === currentUser.id && t.assignee_id && t.assignee_id !== currentUser.id).length;

  const prioOf = (t) => local[t.id] || effectivePriority(t);

  /** Range une tâche dans une colonne de priorité (choix personnel). */
  async function setMyPriority(task, priority) {
    setLocal((l) => ({ ...l, [task.id]: priority }));
    try {
      await api(`/tasks/${task.id}/my-priority`, { method: 'PUT', body: { priority } });
      onRefresh?.();
    } catch {
      setLocal((l) => { const n = { ...l }; delete n[task.id]; return n; });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Carte d'une tâche                                                  */
  /* ---------------------------------------------------------------- */
  function TaskCard({ t, draggable }) {
    const due = dueLabel(t.due_at);
    const prio = PRIO[prioOf(t)] || PRIO.normal;
    const iAmCreator = t.creator_id === currentUser.id;
    const iAmAssignee = t.assignee_id === currentUser.id;
    const creator = { display_name: t.creator_name, avatar_color: t.creator_color, avatar_url: t.creator_avatar };
    const assignee = { display_name: t.assignee_name, avatar_color: t.assignee_color, avatar_url: t.assignee_avatar };

    return (
      <div
        className={`task-item ${t.status === 'done' ? 'is-done' : ''} ${dragId === t.id ? 'is-dragging' : ''} ${draggable ? 'is-draggable' : ''}`}
        draggable={draggable}
        onDragStart={draggable ? (e) => { setDragId(t.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(t.id)); } : undefined}
        onDragEnd={draggable ? () => { setDragId(null); setOverLane(null); } : undefined}
      >
        {draggable && <span className="task-grip" title="Glissez pour changer de priorité"><Icon name="grip-vertical" /></span>}
        <button className={`task-check ${t.status === 'done' ? 'on' : ''}`} title="Terminer" onClick={() => onToggle(t)}>
          {t.status === 'done' ? <Icon name="check" /> : null}
        </button>
        <div className="task-main">
          <div className="task-title">
            <span className="task-prio" style={{ background: prio.dot }} title={`Priorité ${prio.label.toLowerCase()}`} />
            {t.title}
            {t.my_priority || local[t.id] ? <span className="task-mine" title="Priorité que vous avez posée pour vous seul">votre rangement</span> : null}
          </div>

          {/* Qui a confié la tâche, et à qui : avec les visages, pas seulement des mots. */}
          <div className="task-meta">
            <span className="task-people">
              {iAmCreator ? (
                <>
                  <span className="task-by">Créée par vous</span>
                  {t.assignee_id ? (
                    iAmAssignee
                      ? <span className="task-for">pour <strong>vous</strong></span>
                      : <>
                          <span className="task-for">pour</span>
                          <span className="task-person"><Avatar user={assignee} size={20} /> {t.assignee_name}</span>
                        </>
                  ) : <span className="task-unassigned">sans responsable</span>}
                </>
              ) : (
                <>
                  <span className="task-by">Confiée par</span>
                  <span className="task-person"><Avatar user={creator} size={20} /> {t.creator_name}</span>
                  {t.assignee_id ? (
                    iAmAssignee
                      ? <span className="task-for">à <strong>vous</strong></span>
                      : <>
                          <span className="task-for">à</span>
                          <span className="task-person"><Avatar user={assignee} size={20} /> {t.assignee_name}</span>
                        </>
                  ) : null}
                </>
              )}
            </span>

            {due
              ? <span className={`task-due ${due.overdue && t.status !== 'done' ? 'overdue' : ''}`}><Icon name={due.overdue && t.status !== 'done' ? 'triangle-exclamation' : 'calendar'} /> {due.txt}</span>
              : <span className="task-due task-nodue"><Icon name="calendar" /> Sans échéance</span>}
            {t.server_name && (
              <span className="task-src" title={`Serveur ${t.server_name}${t.channel_name ? ' · ' + t.channel_name : ''}`}>
                <span className="task-src-icon" style={{ background: t.server_icon ? undefined : (t.server_color || 'var(--accent)') }}>
                  {t.server_icon ? <img src={mediaUrl(t.server_icon)} alt="" /> : t.server_name.charAt(0).toUpperCase()}
                </span>
                {t.channel_name ? `${t.server_name} · ${t.channel_name}` : t.server_name}
              </span>
            )}
          </div>

          {t.description && (
            <div className="task-detail">
              <button type="button" className="task-detail-toggle" onClick={() => toggleDetail(t.id)}>
                <Icon name={openDetails.has(t.id) ? 'chevron-up' : 'chevron-down'} />
                {openDetails.has(t.id) ? 'Masquer le détail' : 'Voir le détail'}
              </button>
              {openDetails.has(t.id) && <p className="task-detail-text">{t.description}</p>}
            </div>
          )}
        </div>
        <div className="task-actions">
          <select value={t.status} onChange={(e) => onSetStatus(t, e.target.value)} title="Statut">
            <option value="todo">À faire</option>
            <option value="doing">En cours</option>
            <option value="done">Terminé</option>
          </select>
          <button title="Modifier" onClick={() => onEdit(t)}><Icon name="pen" /></button>
          <button title="Supprimer" onClick={() => onDelete(t)}><Icon name="trash" /></button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */

  return (
    <div className="tasks-panel">
      <div className="tasks-bar">
        <Segmented
          value={filter}
          onChange={onFilter}
          options={[
            { value: 'mine', label: `Qui m’est assigné${openCount ? ` · ${openCount}` : ''}` },
            ...(assignedCount > 0 ? [{ value: 'assigned', label: `Attribuées par moi · ${assignedCount}` }] : []),
            { value: 'all', label: 'Tout' },
          ]}
        />
        <div className="tasks-bar-right">
          <Segmented
            value={view}
            onChange={setView}
            options={[{ value: 'statut', label: 'Par avancement' }, { value: 'priorite', label: 'Par priorité' }]}
          />
          <button className="btn tasks-new" onClick={onNew}><Icon name="plus" /> Nouvelle tâche</button>
        </div>
      </div>

      {shown.length === 0 && (
        <p className="tasks-empty">
          Aucune tâche ici. Créez-en une, ou transformez un message en tâche via l’icône <Icon name="circle-check" />.
        </p>
      )}

      {/* ---- Lecture par avancement ---- */}
      {view === 'statut' && GROUPS.map(({ key, label, icon }) => {
        const group = shown.filter((t) => t.status === key);
        if (group.length === 0) return null;
        return (
          <section className="tasks-group" key={key}>
            <h3><Icon name={icon} /> {label} <span className="tasks-count">{group.length}</span></h3>
            <div className="task-list">
              {group.map((t) => <TaskCard key={t.id} t={t} draggable={false} />)}
            </div>
          </section>
        );
      })}

      {/* ---- Rangement par priorité (glisser-déposer) ---- */}
      {view === 'priorite' && shown.length > 0 && (
        <>
          <p className="tasks-hint">
            <Icon name="hand-pointer" />
            Attrapez une tâche et déposez-la dans la colonne qui vous convient. Ce classement n’appartient qu’à vous : les autres gardent la priorité d’origine.
          </p>
          <div className="prio-board">
            {PRIO_LANES.map((lane) => {
              const group = shown.filter((t) => prioOf(t) === lane.key);
              return (
                <section
                  key={lane.key}
                  className={`prio-lane lane-${lane.key} ${overLane === lane.key ? 'over' : ''} ${dragId ? 'ready' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverLane(lane.key); }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverLane((l) => (l === lane.key ? null : l)); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = Number(e.dataTransfer.getData('text/plain')) || dragId;
                    const task = shown.find((t) => t.id === id);
                    setOverLane(null); setDragId(null);
                    if (task && prioOf(task) !== lane.key) setMyPriority(task, lane.key);
                  }}
                >
                  <header className="prio-head">
                    <span className="prio-badge" style={{ background: PRIO[lane.key].dot }}><Icon name={lane.icon} /></span>
                    <span className="prio-title">
                      <strong>{lane.label}</strong>
                      <span className="prio-hint">{lane.hint}</span>
                    </span>
                    <span className="prio-count">{group.length}</span>
                  </header>

                  <div className="prio-list">
                    {group.map((t) => <TaskCard key={t.id} t={t} draggable />)}
                    {group.length === 0 && (
                      <div className="prio-empty">
                        {dragId ? 'Déposez la tâche ici' : 'Rien dans cette colonne'}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
