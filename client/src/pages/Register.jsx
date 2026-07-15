import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

// Critères du mot de passe (affichés en direct).
const rules = (pw) => [
  { ok: pw.length >= 8, label: 'Au moins 8 caractères' },
  { ok: /[a-zA-Z]/.test(pw), label: 'Une lettre' },
  { ok: /[0-9]/.test(pw), label: 'Un chiffre' },
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null); // email d'activation envoyé

  const checks = rules(password);
  const strong = checks.every((c) => c.ok);
  const score = checks.filter((c) => c.ok).length;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) { setError('Adresse email invalide.'); return; }
    if (!strong) { setError('Mot de passe trop faible : respectez les critères ci-dessous.'); return; }
    setBusy(true);
    try {
      const res = await register(username, password, displayName, email.trim());
      if (res?.pending) setSent(res.email);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <Logo />
          <div className="auth-sent">
            <span className="auth-sent-ico"><Icon name="envelope-circle-check" /></span>
            <h1>Vérifiez votre email</h1>
            <p className="subtitle">Nous avons envoyé un lien d'activation à <strong>{sent}</strong>. Cliquez dessus pour activer votre compte, puis connectez-vous.</p>
            <p className="auth-switch">Pas reçu&nbsp;? Pensez aux indésirables. <Link to="/login">Aller à la connexion</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <Logo />
        <h1>Créer un compte</h1>
        <p className="subtitle">Rejoignez Pulsar en quelques secondes.</p>

        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Nom d’utilisateur</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" />
        </div>
        <div className="field">
          <label>Nom affiché <span style={{ textTransform: 'none', color: 'var(--text-faint)' }}>(optionnel)</span></label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Votre nom affiché" />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
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

        <button className="btn" disabled={busy}>{busy ? 'Création…' : 'S’inscrire'}</button>
        <p className="auth-switch">
          Déjà un compte&nbsp;? <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
