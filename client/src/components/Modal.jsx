import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Fenêtre modale réutilisable.
 *
 * On ne ferme JAMAIS sur un clic à côté : un clic malencontreux ne doit pas
 * faire perdre ce qu'on était en train de faire. La sortie se fait par un
 * bouton, ou par Échap (raccourci attendu, désactivable via « escapable »).
 *
 * Rendue dans un portail sur <body> pour rester centrée et couvrir tout l'écran,
 * même si un parent a un filtre/transform (ex. la barre du haut).
 */
export default function Modal({ children, onClose, className = '', escapable = true }) {
  useEffect(() => {
    if (!escapable) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, escapable]);

  return createPortal(
    <div className="modal-backdrop">
      <div className={`modal ${className}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>,
    document.body,
  );
}
