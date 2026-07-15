import { useState } from 'react';
import Icon from './Icon.jsx';

/** Champ mot de passe avec bouton œil (afficher / masquer). */
export default function PasswordInput({ value, onChange, placeholder, autoFocus, autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-field">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
      />
      <button type="button" className="pw-eye" title={show ? 'Masquer' : 'Afficher'} onClick={() => setShow((v) => !v)} tabIndex={-1}>
        <Icon name={show ? 'eye-slash' : 'eye'} />
      </button>
    </div>
  );
}
