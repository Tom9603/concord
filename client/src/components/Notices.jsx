import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';
import { subscribeNotices, dismissNotice } from '../notice.js';

const ICON = { error: 'circle-exclamation', info: 'circle-info', success: 'circle-check' };

/** Messages internes de Pulsar (remplacent les alert() du navigateur). */
export default function Notices() {
  const [items, setItems] = useState([]);
  useEffect(() => subscribeNotices(setItems), []);
  if (!items.length) return null;
  return createPortal(
    <div className="notices">
      {items.map((n) => (
        <div key={n.id} className={`notice ${n.type}`} role="alert">
          <Icon name={ICON[n.type] || ICON.error} />
          <span className="notice-text">{n.message}</span>
          <button className="notice-close" title="Fermer" onClick={() => dismissNotice(n.id)}><Icon name="xmark" /></button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
