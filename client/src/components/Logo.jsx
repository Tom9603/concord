import logoUrl from '../assets/pulsar-logo.png';

// Logo Pulsar : le fichier de la charte graphique (le « P » avec ses ondes).
// wordmark ajoute le mot « PULSAR » à côté ; row = disposition horizontale.
export default function Logo({ size = 62, wordmark = true, row = false }) {
  return (
    <div className={`brand-logo ${row ? 'brand-row' : ''}`}>
      <img className="brand-mark" src={logoUrl} alt="Pulsar" width={size} height={size} />
      {wordmark && <span className="brand-word">PULSAR</span>}
    </div>
  );
}
