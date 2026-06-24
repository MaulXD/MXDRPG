// Pré-computado: hexágono flat-top, r=26, h/2=22.5, toolbar=44px, row=45px
// Centros: col par → y = row*45 + 22.5 + 44; col ímpar → y = row*45 + 45 + 44
// x = col*39 + 26

type HexState = "normal" | "walk" | "run" | "target";

const hexPts = (cx: number, cy: number) =>
  `${cx + 26},${cy} ${cx + 13},${cy + 22.5} ${cx - 13},${cy + 22.5} ${cx - 26},${cy} ${cx - 13},${cy - 22.5} ${cx + 13},${cy - 22.5}`;

const hexFill: Record<HexState, string> = {
  normal: "rgba(0,0,0,0.18)",
  walk:   "rgba(72,130,95,0.38)",
  run:    "rgba(180,150,50,0.36)",
  target: "rgba(200,85,45,0.42)",
};
const hexStroke: Record<HexState, string> = {
  normal: "rgba(255,255,255,0.05)",
  walk:   "rgba(72,150,100,0.55)",
  run:    "rgba(200,160,50,0.55)",
  target: "rgba(210,90,50,0.65)",
};

const grid: Array<{ cx: number; cy: number; state: HexState }> = [
  // col 0
  { cx: 26, cy: 66.5,  state: "normal" },
  { cx: 26, cy: 111.5, state: "normal" },
  { cx: 26, cy: 156.5, state: "normal" },
  { cx: 26, cy: 201.5, state: "normal" },
  // col 1
  { cx: 65, cy: 89,    state: "normal" },
  { cx: 65, cy: 134,   state: "walk"   },
  { cx: 65, cy: 179,   state: "walk"   },
  { cx: 65, cy: 224,   state: "normal" },
  // col 2  ← hero em (104, 156.5)
  { cx: 104, cy: 66.5,  state: "normal" },
  { cx: 104, cy: 111.5, state: "walk"   },
  { cx: 104, cy: 156.5, state: "normal" },
  { cx: 104, cy: 201.5, state: "run"    },
  // col 3
  { cx: 143, cy: 89,    state: "normal" },
  { cx: 143, cy: 134,   state: "walk"   },
  { cx: 143, cy: 179,   state: "walk"   },
  { cx: 143, cy: 224,   state: "normal" },
  // col 4  ← monstro em (182, 111.5)
  { cx: 182, cy: 66.5,  state: "normal" },
  { cx: 182, cy: 111.5, state: "target" },
  { cx: 182, cy: 156.5, state: "run"    },
  { cx: 182, cy: 201.5, state: "normal" },
  // col 5
  { cx: 221, cy: 89,    state: "normal" },
  { cx: 221, cy: 134,   state: "normal" },
  { cx: 221, cy: 179,   state: "normal" },
];

const HERO  = { cx: 104, cy: 156.5 };
const ENEMY = { cx: 182, cy: 111.5 };

export function HeroVttPreview() {
  return (
    <div className="hero-vtt-preview" aria-hidden>
      <svg
        viewBox="0 0 252 258"
        xmlns="http://www.w3.org/2000/svg"
        className="hero-vtt-preview__svg"
        role="presentation"
      >
        <defs>
          {/* Glow radial para o token ativo */}
          <radialGradient id="hvp-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#6B9E8C" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6B9E8C" stopOpacity="0"   />
          </radialGradient>
          {/* Fundo do campo de batalha */}
          <linearGradient id="hvp-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#161512" />
            <stop offset="100%" stopColor="#0f0e0c" />
          </linearGradient>
          {/* Clip para a janela */}
          <clipPath id="hvp-clip">
            <rect x="0" y="0" width="252" height="258" rx="12" />
          </clipPath>
        </defs>

        <g clipPath="url(#hvp-clip)">
          {/* ── Fundo ── */}
          <rect x="0" y="0" width="252" height="258" fill="url(#hvp-bg)" />

          {/* ── Topbar UI chrome ── */}
          <rect x="0" y="0" width="252" height="40" fill="#1e1c18" />
          <line x1="0" y1="40" x2="252" y2="40" stroke="rgba(107,158,140,0.18)" strokeWidth="1" />

          {/* Rodada */}
          <text x="12" y="25" fontFamily="Georgia,serif" fontSize="10" fill="#8a7d68" letterSpacing="0.5">
            RODADA
          </text>
          <text x="58" y="25" fontFamily="Georgia,serif" fontSize="12" fontWeight="bold" fill="#c4bbaa">
            1
          </text>

          {/* PA dots (4 dots, 3 cheios) */}
          {[0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={220 - i * 11}
              cy={21}
              r={4}
              fill={i < 3 ? "#6B9E8C" : "none"}
              stroke="#6B9E8C"
              strokeWidth="1.5"
            />
          ))}
          <text x={165} y={25} fontFamily="Georgia,serif" fontSize="9" fill="#5a5045" letterSpacing="0.5">
            PA
          </text>

          {/* ── Grade de hexágonos ── */}
          {grid.map(({ cx, cy, state }, i) => (
            <polygon
              key={i}
              points={hexPts(cx, cy)}
              fill={hexFill[state]}
              stroke={hexStroke[state]}
              strokeWidth={state === "normal" ? "0.75" : "1.25"}
            />
          ))}

          {/* ── Linha de caminho (herói → monstro) ── */}
          <polyline
            points={`${HERO.cx},${HERO.cy} 143,134 ${ENEMY.cx},${ENEMY.cy}`}
            fill="none"
            stroke="rgba(107,158,140,0.45)"
            strokeWidth="1.5"
            strokeDasharray="5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ── Glow do token ativo ── */}
          <circle
            cx={HERO.cx}
            cy={HERO.cy}
            r={32}
            fill="url(#hvp-glow)"
            className="hvp-glow"
          />

          {/* ── Token herói ── */}
          <circle cx={HERO.cx} cy={HERO.cy} r={17} fill="#1a2e28" />
          <circle
            cx={HERO.cx}
            cy={HERO.cy}
            r={17}
            fill="none"
            stroke="#6B9E8C"
            strokeWidth="2.5"
            className="hvp-ring"
          />
          <text
            x={HERO.cx}
            y={HERO.cy + 4.5}
            textAnchor="middle"
            fontFamily="Georgia,serif"
            fontSize="13"
            fontWeight="bold"
            fill="#c4bbaa"
          >
            A
          </text>

          {/* HP bar — herói */}
          <rect x={HERO.cx - 19} y={HERO.cy + 22} width="38" height="4" rx="2" fill="rgba(0,0,0,0.5)" />
          <rect x={HERO.cx - 19} y={HERO.cy + 22} width="30" height="4" rx="2" fill="#4a9e6a" />

          {/* ── Token monstro ── */}
          <circle cx={ENEMY.cx} cy={ENEMY.cy} r={17} fill="#2a1414" />
          <circle
            cx={ENEMY.cx}
            cy={ENEMY.cy}
            r={17}
            fill="none"
            stroke="#c94a4a"
            strokeWidth="2"
          />
          <text
            x={ENEMY.cx}
            y={ENEMY.cy + 4.5}
            textAnchor="middle"
            fontFamily="Georgia,serif"
            fontSize="13"
            fontWeight="bold"
            fill="#e07070"
          >
            M
          </text>

          {/* HP bar — monstro */}
          <rect x={ENEMY.cx - 19} y={ENEMY.cy + 22} width="38" height="4" rx="2" fill="rgba(0,0,0,0.5)" />
          <rect x={ENEMY.cx - 19} y={ENEMY.cy + 22} width="16" height="4" rx="2" fill="#c94a4a" />

          {/* ── Legenda dos caminhos ── */}
          <circle cx={14} cy={243} r={5} fill="rgba(72,130,95,0.5)" stroke="rgba(72,150,100,0.65)" strokeWidth="1" />
          <text x={24} y={247} fontFamily="Georgia,serif" fontSize="9" fill="#6e6458">Caminhada</text>
          <circle cx={88} cy={243} r={5} fill="rgba(180,150,50,0.5)" stroke="rgba(200,160,50,0.65)" strokeWidth="1" />
          <text x={98} y={247} fontFamily="Georgia,serif" fontSize="9" fill="#6e6458">Corrida</text>
          <circle cx={148} cy={243} r={5} fill="rgba(200,85,45,0.5)" stroke="rgba(210,90,50,0.75)" strokeWidth="1" />
          <text x={158} y={247} fontFamily="Georgia,serif" fontSize="9" fill="#6e6458">Ataque</text>

          {/* ── Borda da janela ── */}
          <rect
            x="0.5" y="0.5"
            width="251" height="257"
            rx="11.5"
            fill="none"
            stroke="rgba(107,158,140,0.22)"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
}
