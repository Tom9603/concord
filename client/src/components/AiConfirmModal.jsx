import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';
import { aiStatus } from '../ai.js';

/**
 * Demande confirmation avant de consommer une action de l'assistant,
 * en rappelant le quota restant pour aujourd'hui.
 * - title / description : ce que l'action va faire
 * - onConfirm : lancé seulement si l'utilisateur accepte
 */
export default function AiConfirmModal({ title, description, onConfirm, onClose }) {
  const [status, setStatus] = useState(null); // { limit, remaining } | null tant qu'on charge

  useEffect(() => {
    let alive = true;
    aiStatus().then((s) => { if (alive) setStatus(s); }).catch(() => { if (alive) setStatus({ error: true }); });
    return () => { alive = false; };
  }, []);

  const remaining = status?.remaining;
  const limit = status?.limit;
  const none = status && !status.error && remaining === 0;

  return (
    <Modal onClose={onClose} className="modal-ai-confirm">
      <h2><Icon name="wand-magic-sparkles" /> {title}</h2>
      <p className="modal-sub">{description}</p>

      <div className={`aic-quota ${none ? 'empty' : ''}`}>
        {!status && <span>Vérification de votre quota…</span>}
        {status?.error && <span>Quota indisponible pour le moment.</span>}
        {status && !status.error && (
          none
            ? <span><Icon name="circle-exclamation" /> Vous avez utilisé vos {limit} actions du jour. Réessayez demain.</span>
            : <span><Icon name="circle-info" /> Il vous reste <strong>{remaining}</strong> action{remaining > 1 ? 's' : ''} sur {limit} aujourd'hui.</span>
        )}
      </div>

      <p className="aic-note">L'assistant peut se tromper : relisez toujours sa réponse.</p>

      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
        <button className="btn" onClick={onConfirm} disabled={!status || none}>
          {none ? 'Quota épuisé' : 'Lancer l’assistant'}
        </button>
      </div>
    </Modal>
  );
}
