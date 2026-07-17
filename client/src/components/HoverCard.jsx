import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Infobulle personnalisée (remplace les infobulles du navigateur).
 * Sobre : pas de halo, pas d'animation. S'affiche après un court délai.
 *
 * - content : ce qu'on affiche (texte simple ou JSX riche)
 * - side    : 'right' (défaut) ou 'top'
 * - delay   : ms avant apparition
 */
export default function HoverCard({ content, side = 'right', delay = 250, className = '', children }) {
  const [pos, setPos] = useState(null); // { x, y } | null quand masquée
  const holder = useRef(null);
  const timer = useRef(null);

  function show() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // Le conteneur est en « display: contents » (neutre pour la mise en page) :
      // il n'a donc pas de boîte propre, on mesure l'élément réellement affiché.
      const el = holder.current?.firstElementChild || holder.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const clampY = (y) => Math.min(Math.max(y, 56), window.innerHeight - 56);
      setPos(side === 'top'
        ? { x: r.left + r.width / 2, y: Math.max(r.top - 10, 56) }
        : { x: r.right + 12, y: clampY(r.top + r.height / 2) });
    }, delay);
  }
  function hide() {
    clearTimeout(timer.current);
    setPos(null);
  }

  if (!content) return children;

  return (
    <>
      <span ref={holder} className="hc-holder" onMouseEnter={show} onMouseLeave={hide} onMouseDown={hide}>
        {children}
      </span>
      {pos && createPortal(
        <div className={`hovercard hc-${side} ${className}`} style={{ left: pos.x, top: pos.y }} role="tooltip">
          {content}
        </div>,
        document.body,
      )}
    </>
  );
}
