// Avatars prêts à l'emploi : illustrations LIBRES DE DROIT (CC0 1.0, aucune
// attribution requise), générées avec la collection « Notionists » de DiceBear.
// Les fichiers sont embarqués dans l'application (aucun appel externe à l'usage).
const modules = import.meta.glob('./assets/avatars/*.png', { eager: true, query: '?url', import: 'default' });
export const PRESET_AVATARS = Object.keys(modules).sort().map((k) => modules[k]);

// Convertit un avatar embarqué en « data URL » pour pouvoir l'enregistrer comme
// photo de profil (le même chemin d'upload que pour une image importée).
export async function assetToDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
