// Logo Pulsar : le « P » (barre claire en avant + bol dégradé) entouré de ses ondes
// qui pulsent, en dégradé violet vers bleu. Mot-symbole optionnel.

const WAVE_CX = 61;
const WAVE_CY = 55;
const WAVES = [
  { key: 'r1', r: 34, a1: -56, a2: 58, o: 0.85, w: 2.4 },
  { key: 'r2', r: 41, a1: -52, a2: 54, o: 0.5, w: 2.2 },
  { key: 'r3', r: 48, a1: -46, a2: 46, o: 0.28, w: 2.0 },
  { key: 'l1', r: 31, a1: 120, a2: 210, o: 0.8, w: 2.4 },
  { key: 'l2', r: 38, a1: 124, a2: 212, o: 0.46, w: 2.2 },
  { key: 'l3', r: 45, a1: 130, a2: 206, o: 0.26, w: 2.0 },
];

function arcPath(cx, cy, r, a1, a2) {
  const pt = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x1, y1] = pt(a1);
  const [x2, y2] = pt(a2);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export default function Logo({ size = 62, wordmark = true, row = false }) {
  return (
    <div className={`brand-logo ${row ? 'brand-row' : ''}`}>
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="pulsar-bowl" x1="0.2" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#b478ef" />
            <stop offset="50%" stopColor="#7d5cec" />
            <stop offset="100%" stopColor="#4f83f5" />
          </linearGradient>
          <linearGradient id="pulsar-stem" x1="0.2" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="#cda6f6" />
            <stop offset="55%" stopColor="#9a8bf3" />
            <stop offset="100%" stopColor="#6f92f7" />
          </linearGradient>
          <linearGradient id="pulsar-wave" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#caa8f7" />
            <stop offset="100%" stopColor="#9db4f7" />
          </linearGradient>
          <filter id="pulsar-stem-shadow" x="-40%" y="-40%" width="190%" height="190%">
            <feDropShadow dx="1.7" dy="1.3" stdDeviation="1.5" floodColor="#170e2c" floodOpacity="0.5" />
          </filter>
        </defs>
        <g fill="none" strokeLinecap="round">
          {WAVES.map((wv) => (
            <path key={wv.key} d={arcPath(WAVE_CX, WAVE_CY, wv.r, wv.a1, wv.a2)} stroke="url(#pulsar-wave)" strokeWidth={wv.w} opacity={wv.o} />
          ))}
        </g>
        <path d="M 50 31 L 71 31 A 18.5 18.5 0 0 1 71 68 L 50 68 Z" fill="url(#pulsar-bowl)" />
        <rect x="44" y="31" width="15" height="58" rx="7.5" fill="url(#pulsar-stem)" filter="url(#pulsar-stem-shadow)" />
      </svg>
      {wordmark && <span className="brand-word">PULSAR</span>}
    </div>
  );
}
