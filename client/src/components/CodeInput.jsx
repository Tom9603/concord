import { useEffect, useRef } from 'react';

/**
 * Saisie d'un code chiffre par chiffre (carrés individuels).
 *
 * - value    : chaîne courante (peut être plus courte que « length »)
 * - onChange : appelé à chaque modification
 * - onComplete : appelé une fois le code entièrement saisi
 * - length   : nombre de carrés
 */
export default function CodeInput({ value, onChange, onComplete, length = 5, disabled, invalid }) {
  const refs = useRef([]);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  function set(next) {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  }

  function onType(i, e) {
    const typed = e.target.value.replace(/\D/g, '');
    if (!typed) return;
    // Un collage peut arriver sur n'importe quel carré : on remplit à partir d'ici.
    const next = set(value.slice(0, i) + typed + value.slice(i + typed.length));
    const focus = Math.min(i + typed.length, length - 1);
    if (next.length >= i + 1) refs.current[focus]?.focus();
  }

  function onKeyDown(i, e) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[i]) set(value.slice(0, i) + value.slice(i + 1));
      else if (i > 0) { set(value.slice(0, i - 1)); refs.current[i - 1]?.focus(); }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  }

  // Le collage depuis l'email (souvent avec des espaces) doit fonctionner d'un bloc.
  function onPaste(e) {
    e.preventDefault();
    set(e.clipboardData.getData('text'));
    refs.current[Math.min(length - 1, e.clipboardData.getData('text').replace(/\D/g, '').length)]?.focus();
  }

  return (
    <div className={`code-input ${invalid ? 'invalid' : ''}`} onPaste={onPaste}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`code-box ${value[i] ? 'filled' : ''}`}
          value={value[i] || ''}
          onChange={(e) => onType(i, e)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`Chiffre ${i + 1}`}
          maxLength={1}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
