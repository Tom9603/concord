import { useState } from 'react';
import Modal from './Modal.jsx';
import Icon from './Icon.jsx';
import Logo from './Logo.jsx';
import Avatar from './Avatar.jsx';
import { api, uploadImage } from '../api.js';
import { fileToImageDataUrl } from '../imagefile.js';
import { useAuth } from '../context/AuthContext.jsx';

// Quelques visuels d'avatar prêts à l'emploi (mêmes dégradés que l'édition du profil).
const PRESETS = [
  { id: 'violet', from: '#8b5cf6', to: '#6366f1' },
  { id: 'ocean', from: '#3b82f6', to: '#06b6d4' },
  { id: 'teal', from: '#14b8a6', to: '#10b981' },
  { id: 'rose', from: '#fb7185', to: '#ec4899' },
  { id: 'amber', from: '#f59e0b', to: '#ea580c' },
  { id: 'indigo', from: '#6366f1', to: '#7c3aed' },
  { id: 'sky', from: '#0ea5e9', to: '#2563eb' },
  { id: 'lime', from: '#22c55e', to: '#65a30d' },
];
const presetCss = (p) => `radial-gradient(circle at 72% 26%, rgba(255,255,255,0.28), transparent 58%), linear-gradient(135deg, ${p.from}, ${p.to})`;
function presetToPng(p, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, p.from); g.addColorStop(1, p.to);
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  const r = x.createRadialGradient(size * 0.72, size * 0.26, size * 0.04, size * 0.72, size * 0.26, size * 0.75);
  r.addColorStop(0, 'rgba(255,255,255,0.30)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = r; x.fillRect(0, 0, size, size);
  return c.toDataURL('image/png');
}

const TOTAL = 3;

/**
 * Fenêtre de personnalisation à la toute première connexion (avant le didacticiel).
 * Ne s'affiche qu'une fois (drapeau `setup_completed` côté serveur). Non fermable
 * au clic à côté : on en sort en terminant ou en passant les étapes.
 */
export default function OnboardingSetup({ onDone }) {
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [presetId, setPresetId] = useState(null);
  const [about, setAbout] = useState(user.about || '');
  const [sound, setSound] = useState(() => localStorage.getItem('pulsar_sound') !== '0');
  const [desktop, setDesktop] = useState(() => localStorage.getItem('pulsar_desktop') === '1');
  const [busy, setBusy] = useState(false);

  const last = step === TOTAL - 1;
  const pickPreset = (p) => { setPresetId(p.id); setAvatarUrl(presetToPng(p)); };

  async function pickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { setPresetId(null); setAvatarUrl(await fileToImageDataUrl(file, { max: 256, square: true })); } catch { /* ignoré */ }
  }

  async function finish() {
    setBusy(true);
    try {
      localStorage.setItem('pulsar_sound', sound ? '1' : '0');
      localStorage.setItem('pulsar_desktop', desktop ? '1' : '0');
      let avatar = avatarUrl;
      if (avatar && avatar.startsWith('data:')) avatar = await uploadImage(avatar);
      const { user: updated } = await api('/users/me', {
        method: 'PATCH',
        body: { display_name: displayName.trim() || user.display_name, avatar_url: avatar || null, about, setup_completed: true },
      });
      updateUser(updated);
    } catch { /* on n'empêche jamais d'entrer dans l'app */ }
    onDone();
  }

  const preview = { display_name: displayName, avatar_color: user.avatar_color, avatar_url: avatarUrl };

  return (
    <Modal className="onboarding onboarding-setup" onClose={() => {}} escapable={false}>
      <div className="ob-head">
        <div className="obs-head-title"><Logo size={30} /><span>Personnalisons votre expérience</span></div>
        <span className="ob-count">{step + 1} sur {TOTAL}</span>
      </div>

      <div className="obs-body">
        {step === 0 && (
          <>
            <h2>Bienvenue sur Pulsar</h2>
            <p className="ob-text">Prenons un instant pour personnaliser votre espace. Tout reste modifiable plus tard.</p>
            <div className="obs-avatar"><Avatar user={preview} size={76} /></div>
            <div className="obs-presets">
              {PRESETS.map((p) => (
                <button type="button" key={p.id} className={`avatar-preset ${presetId === p.id ? 'selected' : ''}`} style={{ background: presetCss(p) }} title="Choisir ce visuel" onClick={() => pickPreset(p)} />
              ))}
            </div>
            <label className="btn btn-ghost import-btn obs-import">
              <Icon name="arrow-up-from-bracket" /> Importer une photo
              <input type="file" accept="image/*" hidden onChange={pickImage} />
            </label>
            <div className="field"><label>Nom affiché</label><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} /></div>
            <div className="field"><label>Bio (facultatif)</label><textarea rows={2} maxLength={300} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Présentez-vous en quelques mots…" /></div>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Vos préférences</h2>
            <p className="ob-text">Réglez vos notifications. Vous pourrez tout ajuster dans les paramètres.</p>
            <label className="settings-toggle"><input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} /><span>Son à la réception d’un message ou d’une tâche</span></label>
            <label className="settings-toggle"><input type="checkbox" checked={desktop} onChange={(e) => setDesktop(e.target.checked)} /><span>Notifications sur le bureau</span></label>
          </>
        )}

        {step === 2 && (
          <div className="obs-done">
            <span className="ob-ico"><Icon name="circle-check" /></span>
            <h2>Tout est prêt</h2>
            <p className="ob-text">Votre espace est personnalisé. Vous pouvez créer un serveur, ajouter un contact, ou rejoindre un salon vocal quand vous voulez.</p>
          </div>
        )}

        <p className="obs-note"><Icon name="circle-info" /> Rien n’est définitif : tout se modifie à tout moment dans les paramètres.</p>
      </div>

      <div className="ob-nav">
        {step > 0 && <button className="btn-ghost" onClick={() => setStep((v) => v - 1)}>Retour</button>}
        {!last && <button className="btn-ghost" onClick={() => setStep((v) => v + 1)}>Passer</button>}
        {last
          ? <button className="btn" onClick={finish} disabled={busy}>{busy ? 'Un instant…' : 'Commencer'}</button>
          : <button className="btn" onClick={() => setStep((v) => v + 1)}>Suivant</button>}
      </div>
    </Modal>
  );
}
