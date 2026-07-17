import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import VerifyCode from '../components/VerifyCode.jsx';
import PasswordFields, { isStrong } from '../components/PasswordFields.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null); // code de confirmation envoyé
  const strong = isStrong(password);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) { setError('Adresse email invalide.'); return; }
    if (!strong) { setError('Mot de passe trop faible : respectez les critères ci-dessous.'); return; }
    if (confirm !== password) { setError('Les deux mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    try {
      const res = await register(username, password, displayName, email.trim());
      if (res?.pending) setSent(res.email);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (sent) return <VerifyCode email={sent} />;

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
        <PasswordFields password={password} onPassword={setPassword} confirm={confirm} onConfirm={setConfirm} />

        <button className="btn" disabled={busy}>{busy ? 'Création…' : 'S’inscrire'}</button>
        <p className="auth-switch">
          Déjà un compte&nbsp;? <Link to="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
