import { useUpdate, beginUpdate, dismissUpdate } from '../update.js';
import Icon from './Icon.jsx';
import logoUrl from '../assets/pulsar-logo.png';

// Logo Pulsar réutilisé dans la fenêtre de téléchargement.
function PulseMark({ size = 72 }) {
  return <img className="ut-mark" src={logoUrl} alt="Pulsar" width={size} height={size} />;
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
    // Pas de fermeture au clic à côté : on sort par « Plus tard » ou en mettant à jour.
    <div className="modal-backdrop">
      <div className="modal update-modal" role="dialog" aria-modal="true">
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
