import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import PasswordFields, { isStrong } from '../components/PasswordFields.jsx';

/** Page atteinte depuis le lien reçu par email : choix d'un nouveau mot de passe. */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // On vérifie le lien avant d'afficher le formulaire : inutile de faire saisir
  // un mot de passe pour annoncer ensuite que le lien a expiré.
  useEffect(() => {
    if (!token) { setChecking(false); return; }
    api(`/auth/reset-check?token=${encodeURIComponent(token)}`)
      .then((r) => setValid(r.valid))
      .catch(() => setValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!isStrong(password)) { setError('Mot de passe trop faible : respectez les critères ci-dessous.'); return; }
    if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return; }
    setBusy(true);
    try {
      await api('/auth/reset', { method: 'POST', body: { token, password } });
      setDone(true);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="auth-wrap"><div className="auth-card"><Logo /><p className="subtitle">Vérification du lien…</p></div></div>
    );
  }

  if (done) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <Logo />
          <div className="auth-sent">
            <span className="auth-sent-ico auth-sent-ok"><Icon name="circle-check" /></span>
            <h1>Mot de passe modifié</h1>
            <p className="subtitle">
              C'est enregistré. Par sécurité, toutes vos sessions ouvertes ont été fermées
              et un email de confirmation vient de vous être envoyé.
            </p>
            <button className="btn auth-verify-btn" onClick={() => navigate('/login')}>Se connecter</button>
          </div>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <Logo />
          <div className="auth-sent">
            <span className="auth-sent-ico auth-sent-ko"><Icon name="circle-exclamation" /></span>
            <h1>Lien expiré</h1>
            <p className="subtitle">Ce lien n'est plus valable ou a déjà servi. Demandez-en un nouveau depuis la page de connexion.</p>
            <p className="auth-switch"><Link to="/login">Retour à la connexion</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <Logo />
        <h1>Nouveau mot de passe</h1>
        <p className="subtitle">Choisissez un mot de passe solide, différent des précédents.</p>

        {error && <div className="error-msg">{error}</div>}

        <PasswordFields
          password={password}
          onPassword={(v) => { setPassword(v); setError(''); }}
          confirm={confirm}
          onConfirm={(v) => { setConfirm(v); setError(''); }}
          label="Nouveau mot de passe"
        />

        <button className="btn" disabled={busy}>{busy ? 'Enregistrement…' : 'Changer mon mot de passe'}</button>
        <p className="auth-switch"><Link to="/login">Retour à la connexion</Link></p>
      </form>
    </div>
  );
}
