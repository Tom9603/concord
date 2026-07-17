import { uploadFile } from './api.js';
import { notify } from './notice.js';

export const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo, aligné sur la limite du serveur

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

/** Nom lisible pour une capture collée (le presse-papier ne fournit pas de nom). */
function nameFor(file) {
  if (file.name && file.name !== 'image.png') return file.name;
  const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
  return `Capture ${stamp}.${ext}`;
}

/**
 * Envoie un ou plusieurs fichiers dans la conversation courante.
 * Partagé par le bouton « Joindre », le collage et le glisser-déposer, pour
 * que les trois se comportent exactement pareil.
 *
 * @param files              FileList ou tableau de File
 * @param onSendAttachment   (url, texte, nom) => void
 * @param text               légende à joindre au premier fichier seulement
 * @returns true si au moins un fichier est parti
 */
export async function sendFiles(files, onSendAttachment, text = '') {
  const list = Array.from(files || []).filter(Boolean);
  if (!list.length) return false;

  const tooBig = list.filter((f) => f.size > MAX_SIZE);
  const ok = list.filter((f) => f.size <= MAX_SIZE);
  if (tooBig.length) {
    notify(tooBig.length === 1
      ? `« ${tooBig[0].name} » dépasse 8 Mo et n'a pas été envoyé.`
      : `${tooBig.length} fichiers dépassent 8 Mo et n'ont pas été envoyés.`);
  }
  if (!ok.length) return false;

  let sent = false;
  for (const [i, file] of ok.entries()) {
    try {
      const { url, name } = await uploadFile(await readAsDataURL(file), nameFor(file));
      onSendAttachment(url, i === 0 ? text : '', name);
      sent = true;
    } catch (e) {
      notify(`Envoi de « ${file.name || 'la pièce jointe'} » impossible : ${e.message}`);
    }
  }
  return sent;
}

/** Extrait les fichiers d'un évènement de collage (capture d'écran, image copiée). */
export function filesFromPaste(e) {
  const items = Array.from(e.clipboardData?.items || []);
  return items.filter((it) => it.kind === 'file').map((it) => it.getAsFile()).filter(Boolean);
}

/** L'élément glissé contient-il des fichiers ? (et non du texte ou un lien) */
export function dragHasFiles(e) {
  return Array.from(e.dataTransfer?.types || []).includes('Files');
}
