import Icon from './Icon.jsx';
import PasswordInput from './PasswordInput.jsx';

/** Critères du mot de passe (affichés en direct). */
export const passwordRules = (pw) => [
  { ok: pw.length >= 8, label: 'Au moins 8 caractères' },
  { ok: /[a-zA-Z]/.test(pw), label: 'Une lettre' },
  { ok: /[0-9]/.test(pw), label: 'Un chiffre' },
];

export const isStrong = (pw) => passwordRules(pw).every((c) => c.ok);

/**
 * Couple « mot de passe + confirmation » avec jauge de force et critères.
 * Partagé par l'inscription et la réinitialisation, pour une expérience
 * identique aux deux endroits.
 */
export default function PasswordFields({ password, onPassword, confirm, onConfirm, label = 'Mot de passe' }) {
  const checks = passwordRules(password);
  const score = checks.filter((c) => c.ok).length;
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <>
      <div className="field">
        <label>{label}</label>
        <PasswordInput value={password} onChange={(e) => onPassword(e.target.value)} autoComplete="new-password" />
        {password && (
          <div className="pw-strength">
            <div className={`pw-bar s${score}`}><span /></div>
            <ul className="pw-rules">
              {checks.map((c) => (
                <li key={c.label} className={c.ok ? 'ok' : ''}><Icon name={c.ok ? 'circle-check' : 'circle'} regular={!c.ok} /> {c.label}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="field">
        <label>Confirmer le mot de passe</label>
        <PasswordInput value={confirm} onChange={(e) => onConfirm(e.target.value)} autoComplete="new-password" />
        {mismatch && <p className="pw-mismatch"><Icon name="circle-exclamation" /> Les deux mots de passe ne correspondent pas.</p>}
        {confirm && !mismatch && <p className="pw-match"><Icon name="circle-check" /> Les mots de passe correspondent.</p>}
      </div>
    </>
  );
}
