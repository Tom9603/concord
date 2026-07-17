import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Demande d'un lien de réinitialisation par email. */
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) { setError('Adresse email invalide.'); return; }
    setBusy(true);
    try {
      await api('/auth/forgot', { method: 'POST', body: { email: email.trim() } });
      setSent(true);
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
            <h1>Regardez vos emails</h1>
            {/* Réponse volontairement neutre : on ne révèle pas si le compte existe. */}
            <p className="subtitle">
              Si un compte Pulsar est associé à <strong>{email.trim()}</strong>, un lien pour changer
              votre mot de passe vient d'y être envoyé. Il est valable une heure.
            </p>
            <p className="auth-switch">Rien reçu&nbsp;? Pensez aux indésirables. <Link to="/login">Retour à la connexion</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <Logo />
        <h1>Mot de passe oublié</h1>
        <p className="subtitle">Indiquez votre adresse email : nous vous enverrons un lien pour en choisir un nouveau.</p>

        {error && <div className="error-msg">{error}</div>}

        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="vous@exemple.com" autoComplete="email" autoFocus />
        </div>

        <button className="btn" disabled={busy}>{busy ? 'Envoi…' : 'Envoyer le lien'}</button>
        <p className="auth-switch">Vous vous en souvenez&nbsp;? <Link to="/login">Se connecter</Link></p>
      </form>
    </div>
  );
}
