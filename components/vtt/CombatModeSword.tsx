"use client";

type Props = {
  idPrefix: string;
  className?: string;
};

/** Espada longa — preview Eldarin (lâmina, guarda dourada, cabo). */
export function CombatModeSword({ idPrefix, className }: Props) {
  const blade = `${idPrefix}-blade`;
  const edge = `${idPrefix}-edge`;
  const gold = `${idPrefix}-gold`;
  const grip = `${idPrefix}-grip`;

  return (
    <svg
      className={className}
      viewBox="0 0 56 200"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={blade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6e7680" />
          <stop offset="18%" stopColor="#d8dde8" />
          <stop offset="42%" stopColor="#f8fafc" />
          <stop offset="58%" stopColor="#c5ccd8" />
          <stop offset="82%" stopColor="#9aa3b0" />
          <stop offset="100%" stopColor="#5c636c" />
        </linearGradient>
        <linearGradient id={edge} x1="28" y1="4" x2="28" y2="118" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#e8ecf4" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8890a0" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5e6a8" />
          <stop offset="45%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#7a5a18" />
        </linearGradient>
        <linearGradient id={grip} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a1810" />
          <stop offset="50%" stopColor="#4a3020" />
          <stop offset="100%" stopColor="#1e1008" />
        </linearGradient>
      </defs>
      <g>
        <path
          d="M 28 3 L 30.2 14 L 31.2 52 L 31.8 98 L 32.4 118 L 33.8 126 L 28 130 L 22.2 126 L 23.6 118 L 24.2 98 L 24.8 52 L 25.8 14 Z"
          fill={`url(#${blade})`}
          stroke="#3d4450"
          strokeWidth="0.65"
          strokeLinejoin="round"
        />
        <path d="M 28 18 L 28.6 108 L 27.4 108 L 28 18 Z" fill="rgba(30,38,48,0.35)" />
        <path d="M 27.2 8 L 27.8 95 L 26.8 95 Z" fill={`url(#${edge})`} opacity="0.85" />
        <path
          d="M 8 124 L 12 128 L 48 128 L 52 124 L 50 130 L 28 134 L 6 130 Z"
          fill={`url(#${gold})`}
          stroke="#5a4010"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        <rect
          x="24"
          y="134"
          width="8"
          height="38"
          rx="1.5"
          fill={`url(#${grip})`}
          stroke="#1a0c06"
          strokeWidth="0.5"
        />
        <circle cx="28" cy="178" r="7" fill={`url(#${gold})`} stroke="#5a4010" strokeWidth="0.6" />
        <circle cx="28" cy="177" r="2.2" fill="#8a2020" stroke="#4a1010" strokeWidth="0.4" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line
            key={i}
            x1="24.5"
            x2="31.5"
            y1={138 + i * 5}
            y2={138 + i * 5}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="0.8"
          />
        ))}
      </g>
    </svg>
  );
}
