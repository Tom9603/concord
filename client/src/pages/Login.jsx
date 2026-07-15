import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { IS_DESKTOP, getServerUrl, setServerUrl } from '../config.js';
import { api } from '../api.js';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Login() {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const justVerified = params.get('verified') === '1';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState(getServerUrl() || 'http://localhost:3001');
  const [error, setError] = useState('');
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resent, setResent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(''); setNeedsVerify(false);
    if (IS_DESKTOP) setServerUrl(server); // mémorise l'adresse du serveur choisie
    setBusy(true);
    try {
      await login(username, password);
    } catch (err) {
      if (/non activé/i.test(err.message)) setNeedsVerify(true);
      setError(err.message);
      setBusy(false);
    }
  }

  async function resend() {
    try { await api('/auth/resend', { method: 'POST', body: { login: username.trim() } }); setResent(true); } catch { /* neutre */ }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <Logo />
        <h1>Content de vous revoir&nbsp;!</h1>
        <p className="subtitle">Connectez-vous pour accéder à vos espaces.</p>

        {justVerified && <div className="ok-msg"><Icon name="circle-check" /> Compte activé. Vous pouvez vous connecter.</div>}
        {error && <div className="error-msg">{error}</div>}
        {needsVerify && !resent && (
          <button type="button" className="auth-resend" onClick={resend}><Icon name="paper-plane" /> Renvoyer l'email d'activation</button>
        )}
        {resent && <div className="ok-msg"><Icon name="circle-check" /> Si le compte existe, un email vient d'être renvoyé.</div>}

        {IS_DESKTOP && (
          <div className="field">
            <label>Adresse du serveur</label>
            <input value={server} onChange={(e) => setServer(e.target.value)} placeholder="http://192.168.1.20:3001" />
          </div>
        )}

        <div className="field">
          <label>Nom d’utilisateur ou email</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>

        <button className="btn" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        <p className="auth-switch">
          Pas encore de compte&nbsp;? <Link to="/register">S’inscrire</Link>
        </p>
      </form>
    </div>
  );
}
