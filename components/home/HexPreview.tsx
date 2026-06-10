"use client";

/** Visual hero — grid hex decorativo animado */
export function HexPreview() {
  const cells: { q: number; r: number; delay: number }[] = [];
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) {
      if (Math.abs(q + r) <= 3) cells.push({ q, r, delay: (q + r + 6) * 0.08 });
    }
  }

  const size = 28;
  const toXY = (q: number, r: number) => ({
    x: size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r) + 200,
    y: size * ((3 / 2) * r) + 200,
  });

  return (
    <div className="hero-visual animate-float">
      <div className="hex-preview-glow" aria-hidden />
      <svg viewBox="0 0 400 400" className="hex-preview-svg" role="img" aria-label="Grid hexagonal">
        <defs>
          <linearGradient id="hexStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a962" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#8b4545" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {cells.map(({ q, r, delay }) => {
          const { x, y } = toXY(q, r);
          const dist = Math.abs(q) + Math.abs(r) + Math.abs(q + r);
          const isCore = dist <= 2;
          return (
            <g key={`${q}-${r}`} style={{ animationDelay: `${delay}s` }} className="hex-cell">
              <polygon
                points={hexPoints(x, y, size - 2)}
                fill={isCore ? "rgba(201, 169, 98, 0.14)" : "rgba(180, 155, 110, 0.04)"}
                stroke="url(#hexStroke)"
                strokeWidth={isCore ? 1.2 : 0.6}
                strokeOpacity={isCore ? 0.85 : 0.35}
              />
            </g>
          );
        })}
        <circle cx={toXY(0, 0).x} cy={toXY(0, 0).y} r="14" fill="#c9a962" opacity="0.9">
          <animate attributeName="r" values="12;15;12" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx={toXY(2, -1).x} cy={toXY(2, -1).y} r="10" fill="#8b4545" opacity="0.85" />
      </svg>
      <div className="hex-preview-badge">
        <span className="badge-dot walk" />
        Caminhada
        <span className="badge-dot run" />
        Corrida
      </div>
    </div>
  );
}

function hexPoints(cx: number, cy: number, size: number): string {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = ((60 * i - 30) * Math.PI) / 180;
    pts.push(`${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`);
  }
  return pts.join(" ");
}
