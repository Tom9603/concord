import { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { dragHasFiles } from '../attachments.js';

/**
 * Enveloppe une zone (salon, message privé) pour y déposer des fichiers.
 * Un voile discret apparaît pendant le survol du glisser.
 *
 * Le compteur est nécessaire : « dragleave » se déclenche aussi en passant
 * d'un élément enfant à un autre, ce qui ferait clignoter le voile.
 */
export default function FileDropZone({ onFiles, label = 'Déposez pour envoyer', children }) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  function onDragEnter(e) {
    if (!dragHasFiles(e)) return;
    depth.current += 1;
    setOver(true);
  }
  function onDragLeave(e) {
    if (!dragHasFiles(e)) return;
    depth.current -= 1;
    if (depth.current <= 0) { depth.current = 0; setOver(false); }
  }
  function onDragOver(e) {
    if (!dragHasFiles(e)) return;
    e.preventDefault(); // sans ça, le navigateur ouvre le fichier à la place
    e.dataTransfer.dropEffect = 'copy';
  }
  function onDrop(e) {
    if (!dragHasFiles(e)) return;
    e.preventDefault();
    depth.current = 0;
    setOver(false);
    const files = e.dataTransfer.files;
    if (files?.length) onFiles(files);
  }

  return (
    <div className="dropzone" onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}>
      {children}
      {over && (
        <div className="dropzone-veil">
          <div className="dropzone-card">
            <Icon name="cloud-arrow-up" />
            <span>{label}</span>
            <small>8 Mo maximum par fichier</small>
          </div>
        </div>
      )}
    </div>
  );
}
