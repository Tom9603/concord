import { useUpdate, beginUpdate, dismissUpdate } from '../update.js';
import Icon from './Icon.jsx';

// Logo Pulsar (P qui pulse) réutilisé dans la fenêtre de téléchargement.
function PulseMark({ size = 66 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" className="ut-mark">
      <defs>
        <linearGradient id="ut-bowl" x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#b478ef" />
          <stop offset="50%" stopColor="#7d5cec" />
          <stop offset="100%" stopColor="#4f83f5" />
        </linearGradient>
        <linearGradient id="ut-stem" x1="0.2" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#cda6f6" />
          <stop offset="55%" stopColor="#9a8bf3" />
          <stop offset="100%" stopColor="#6f92f7" />
        </linearGradient>
        <linearGradient id="ut-wave" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#caa8f7" />
          <stop offset="100%" stopColor="#9db4f7" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#ut-wave)" strokeLinecap="round">
        <path strokeWidth="2.4" opacity="0.85" d="M 80.01 26.81 A 34 34 0 0 1 79.02 83.83" />
        <path strokeWidth="2.2" opacity="0.5" d="M 86.24 22.69 A 41 41 0 0 1 85.10 88.17" />
        <path strokeWidth="2" opacity="0.28" d="M 94.34 20.47 A 48 48 0 0 1 94.34 89.53" />
        <path strokeWidth="2.4" opacity="0.8" d="M 45.50 81.85 A 31 31 0 0 1 34.15 39.50" />
        <path strokeWidth="2.2" opacity="0.46" d="M 39.75 86.50 A 38 38 0 0 1 28.77 34.86" />
        <path strokeWidth="2" opacity="0.26" d="M 32.07 89.47 A 45 45 0 0 1 20.55 35.27" />
      </g>
      <path d="M 50 31 L 71 31 A 18.5 18.5 0 0 1 71 68 L 50 68 Z" fill="url(#ut-bowl)" />
      <rect x="44" y="31" width="15" height="58" rx="7.5" fill="url(#ut-stem)" />
    </svg>
  );
}

/** Gère l'invitation à mettre à jour et la fenêtre de téléchargement (desktop). */
export default function UpdateManager() {
  const u = useUpdate();

  // Fenêtre de téléchargement : prend tout l'écran, progression, puis redémarrage auto.
  if (u.phase === 'downloading' || u.phase === 'downloaded') {
    const done = u.phase === 'downloaded';
    const pct = done ? 100 : u.progress;
    return (
      <div className="update-takeover">
        <div className="ut-card">
          <PulseMark />
          <h2>{done ? 'Mise à jour prête' : 'Mise à jour en cours'}</h2>
          <p className="ut-sub">
            {done
              ? 'Redémarrage de Pulsar en cours, veuillez patienter.'
              : 'Téléchargement de la nouvelle version. Pulsar redémarrera tout seul une fois terminé.'}
          </p>
          <div className="ut-bar"><i style={{ width: `${pct}%` }} /></div>
          <div className="ut-meta">
            <span>{pct}%</span>
            {u.version && <span>Version {u.version}</span>}
          </div>
        </div>
      </div>
    );
  }

  if (!u.available || !u.open) return null;

  return (
    <div className="modal-backdrop" onClick={dismissUpdate}>
      <div className="modal update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="um-badge"><Icon name="arrows-rotate" /></div>
        <h2>Nouvelle version disponible</h2>
        {u.version
          ? <p className="um-ver">Pulsar {u.version} est prête à être installée.</p>
          : <p className="um-ver">Une nouvelle version de Pulsar est prête.</p>}
        <p className="um-desc">
          {u.isDesktop
            ? 'La mise à jour se télécharge, puis Pulsar redémarre automatiquement. Vos données restent en place.'
            : 'Rechargez pour profiter de la dernière version. Vos données restent en place.'}
        </p>
        <div className="um-actions">
          <button className="btn-ghost" onClick={dismissUpdate}>Plus tard</button>
          <button className="btn um-go" onClick={beginUpdate}>
            <Icon name="arrows-rotate" /> Mettre à jour maintenant
          </button>
        </div>
      </div>
    </div>
  );
}
