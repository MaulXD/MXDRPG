// Grid quadrado tático — cell=30px, step=31px (30 + 1px de gap)
// 8 colunas × 6 linhas, toolbar de 40px no topo
// Herói em (col=2, row=3), Monstro em (col=5, row=2)

type CellState = "normal" | "walk" | "run" | "target";

const CELL = 30;
const GAP  = 1;
const STEP = CELL + GAP; // 31
const OX   = 2;  // offset x da grade
const OY   = 42; // offset y (abaixo da toolbar)

function cx(col: number) { return OX + col * STEP + CELL / 2; }
function cy(row: number) { return OY + row * STEP + CELL / 2; }
function rx(col: number) { return OX + col * STEP; }
function ry(row: number) { return OY + row * STEP; }

const FILL: Record<CellState, string> = {
  normal: "rgba(255,255,255,0.03)",
  walk:   "rgba(72,140,100,0.42)",
  run:    "rgba(185,155,50,0.40)",
  target: "rgba(205,80,45,0.48)",
};
const STROKE: Record<CellState, string> = {
  normal: "rgba(255,255,255,0.09)",
  walk:   "rgba(90,170,115,0.75)",
  run:    "rgba(210,170,55,0.75)",
  target: "rgba(220,90,50,0.85)",
};

// 8 colunas × 6 linhas
const COLS = 8;
const ROWS = 6;

// Estados das células (não-normais)
const STATES: Record<string, CellState> = {
  "1,2": "walk", "2,2": "walk", "3,2": "walk",
  "1,3": "walk",               "3,3": "walk",
  "1,4": "walk", "2,4": "walk", "3,4": "walk",
  "4,2": "run",  "4,3": "run",  "4,4": "run",
  "5,2": "target",
};

const cells = Array.from({ length: COLS * ROWS }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return { col, row, state: (STATES[`${col},${row}`] ?? "normal") as CellState };
});

// Herói e monstro
const HERO  = { cx: cx(2), cy: cy(3) };
const ENEMY = { cx: cx(5), cy: cy(2) };

// Caminho do herói ao monstro
const PATH = `${HERO.cx},${HERO.cy} ${cx(3)},${cy(2)} ${cx(4)},${cy(2)} ${ENEMY.cx},${ENEMY.cy}`;

// ViewBox: 2 + 8*31 - 1 + 3 = 252 wide; 42 + 6*31 - 1 + 4 = 231 tall
const VW = 252;
const VH = 230;

export function HeroVttPreview() {
  return (
    <div className="hero-vtt-preview" aria-hidden="true">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        xmlns="http://www.w3.org/2000/svg"
        className="hero-vtt-preview__svg"
        role="presentation"
      >
        <defs>
          <radialGradient id="hvp-hero-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#6B9E8C" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#6B9E8C" stopOpacity="0"   />
          </radialGradient>
          <linearGradient id="hvp-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#181614" />
            <stop offset="100%" stopColor="#0f0e0c" />
          </linearGradient>
          <clipPath id="hvp-clip">
            <rect x="0" y="0" width={VW} height={VH} rx="12" />
          </clipPath>
        </defs>

        <g clipPath="url(#hvp-clip)">
          {/* Fundo */}
          <rect x="0" y="0" width={VW} height={VH} fill="url(#hvp-bg)" />

          {/* ── Toolbar ── */}
          <rect x="0" y="0" width={VW} height="40" fill="#1d1b17" />
          <line x1="0" y1="40" x2={VW} y2="40" stroke="rgba(107,158,140,0.22)" strokeWidth="1" />

          <text x="12" y="15" fontFamily="Georgia,serif" fontSize="8.5" fill="#6e6458" letterSpacing="1">
            RODADA
          </text>
          <text x="58" y="15" fontFamily="Georgia,serif" fontSize="11" fontWeight="bold" fill="#c4bbaa">
            1
          </text>

          {/* Iniciativa: dois nomes */}
          <rect x="12" y="21" width="8" height="8" rx="2" fill="#6B9E8C" opacity="0.85" />
          <text x="24" y="28.5" fontFamily="Georgia,serif" fontSize="8" fill="#c4bbaa">Aventureiro</text>
          <rect x="88" y="21" width="8" height="8" rx="2" fill="#c94a4a" opacity="0.7" />
          <text x="100" y="28.5" fontFamily="Georgia,serif" fontSize="8" fill="#8a7d68">Monstro</text>

          {/* PA dots */}
          <text x="190" y="15" fontFamily="Georgia,serif" fontSize="8" fill="#6e6458" letterSpacing="0.5">
            PA
          </text>
          {[0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={VW - 12 - i * 11}
              cy={12}
              r="3.5"
              fill={i < 3 ? "#6B9E8C" : "none"}
              stroke="#6B9E8C"
              strokeWidth="1.25"
              opacity={i < 3 ? 1 : 0.5}
            />
          ))}
          {/* HP bar herói na toolbar */}
          <text x="190" y="30" fontFamily="Georgia,serif" fontSize="8" fill="#6e6458" letterSpacing="0.5">
            HP
          </text>
          <rect x="207" y="24" width="36" height="5" rx="2" fill="rgba(0,0,0,0.5)" />
          <rect x="207" y="24" width="28" height="5" rx="2" fill="#4a9e6a" />

          {/* ── Células da grade ── */}
          {cells.map(({ col, row, state }) => (
            <rect
              key={`${col}-${row}`}
              x={rx(col)}
              y={ry(row)}
              width={CELL}
              height={CELL}
              fill={FILL[state]}
              stroke={STROKE[state]}
              strokeWidth={state === "normal" ? "0.5" : "1"}
            />
          ))}

          {/* ── Caminho (dashed) ── */}
          <polyline
            points={PATH}
            fill="none"
            stroke="rgba(107,158,140,0.55)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* ── Glow do token ativo ── */}
          <circle
            cx={HERO.cx}
            cy={HERO.cy}
            r="26"
            fill="url(#hvp-hero-glow)"
            className="hvp-glow"
          />

          {/* ── Token herói ── */}
          <rect
            x={HERO.cx - 13}
            y={HERO.cy - 13}
            width="26"
            height="26"
            rx="5"
            fill="#1a2e28"
          />
          <rect
            x={HERO.cx - 13}
            y={HERO.cy - 13}
            width="26"
            height="26"
            rx="5"
            fill="none"
            stroke="#6B9E8C"
            strokeWidth="2"
            className="hvp-ring"
          />
          <text
            x={HERO.cx}
            y={HERO.cy + 4}
            textAnchor="middle"
            fontFamily="Georgia,serif"
            fontSize="12"
            fontWeight="bold"
            fill="#c4bbaa"
          >
            A
          </text>

          {/* ── Token monstro ── */}
          <rect
            x={ENEMY.cx - 13}
            y={ENEMY.cy - 13}
            width="26"
            height="26"
            rx="5"
            fill="#2a1414"
          />
          <rect
            x={ENEMY.cx - 13}
            y={ENEMY.cy - 13}
            width="26"
            height="26"
            rx="5"
            fill="none"
            stroke="#c94a4a"
            strokeWidth="1.75"
          />
          <text
            x={ENEMY.cx}
            y={ENEMY.cy + 4}
            textAnchor="middle"
            fontFamily="Georgia,serif"
            fontSize="12"
            fontWeight="bold"
            fill="#e07070"
          >
            M
          </text>

          {/* ── Legenda ── */}
          <rect x="12" y={VH - 18} width="10" height="10" rx="2" fill={FILL.walk}   stroke={STROKE.walk}   strokeWidth="1" />
          <text x="26" y={VH - 9}  fontFamily="Georgia,serif" fontSize="8.5" fill="#8a7d68">Caminhada</text>
          <rect x="88" y={VH - 18} width="10" height="10" rx="2" fill={FILL.run}    stroke={STROKE.run}    strokeWidth="1" />
          <text x="102" y={VH - 9} fontFamily="Georgia,serif" fontSize="8.5" fill="#8a7d68">Corrida</text>
          <rect x="152" y={VH - 18} width="10" height="10" rx="2" fill={FILL.target} stroke={STROKE.target} strokeWidth="1" />
          <text x="166" y={VH - 9} fontFamily="Georgia,serif" fontSize="8.5" fill="#8a7d68">Alvo</text>

          {/* Borda da janela */}
          <rect
            x="0.5" y="0.5"
            width={VW - 1} height={VH - 1}
            rx="11.5"
            fill="none"
            stroke="rgba(107,158,140,0.28)"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
}
