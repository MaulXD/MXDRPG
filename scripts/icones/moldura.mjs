/**
 * Moldura fixa dos ícones (magias, habilidades...). A arte central vem do gerador
 * de imagem SEM borda; a borda dourada, o brilho ametista e a gema da escola são
 * sempre estes, para os 160+ ícones saírem iguais.
 *
 * Camadas (512x512): fundo() -> arte recortada na janela -> sobreposicao(gema).
 */

export const TAM = 512;
/** Janela da arte: quadrado arredondado centralizado. */
export const JANELA = { x: 44, y: 44, lado: 424, raio: 30 };

export const COR = {
  fundo: "#0e0d0b",
  ouro: "#c4a44a",
  ouroClaro: "#f0d78a",
  ouroEscuro: "#6e5520",
  ametista: "#8B7BB8",
};

/** Cor da gema por escola de magia (só a gema muda; a moldura é a mesma). */
export const GEMA_ESCOLA = {
  "Evocação": "#e0703a",
  "Abjuração": "#5fa8e8",
  "Adivinhação": "#e9e2c8",
  "Necromancia": "#3f8f6b",
  "Transmutação": "#4fc0b0",
  "Encantamento": "#d46aa8",
  "Ilusão": "#9b7be0",
  "Conjuração": "#5a6fe0",
  "Biomancia": "#9acd32",
};

const { x, y, lado, raio } = JANELA;

/** Fundo escuro + brilho ametista suave atrás da arte. */
export function svgFundo() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TAM}" height="${TAM}">
  <defs>
    <radialGradient id="brilho" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${COR.ametista}" stop-opacity="0.42"/>
      <stop offset="55%" stop-color="${COR.ametista}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${COR.ametista}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${TAM}" height="${TAM}" rx="44" fill="${COR.fundo}"/>
  <rect x="${x}" y="${y}" width="${lado}" height="${lado}" rx="${raio}" fill="url(#brilho)"/>
</svg>`;
}

/** Máscara da arte: janela arredondada com borda esfumada (a arte some no fundo). */
export function svgMascara() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TAM}" height="${TAM}">
  <defs>
    <radialGradient id="m" cx="50%" cy="50%" r="62%">
      <stop offset="70%" stop-color="#fff" stop-opacity="1"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="${x}" y="${y}" width="${lado}" height="${lado}" rx="${raio}" fill="url(#m)"/>
</svg>`;
}

function losango(cx, cy, r) {
  return `M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z`;
}

/** Borda dourada dupla, ornamentos nos cantos e no meio dos lados, gema opcional no topo. */
export function svgSobreposicao(gema) {
  const c = TAM / 2;
  const cantos = [
    [x, y],
    [x + lado, y],
    [x, y + lado],
    [x + lado, y + lado],
  ];
  const meios = [
    [c, y + lado],
    [x, c],
    [x + lado, c],
  ];
  const orn = [
    ...cantos.map(([a, b]) => `<path d="${losango(a, b, 16)}" fill="url(#ouro)" stroke="${COR.ouroEscuro}" stroke-width="2"/>
    <path d="${losango(a, b, 6)}" fill="${COR.fundo}"/>`),
    ...meios.map(([a, b]) => `<path d="${losango(a, b, 9)}" fill="url(#ouro)" stroke="${COR.ouroEscuro}" stroke-width="1.5"/>`),
  ].join("\n    ");

  const gemaSvg = gema
    ? `<circle cx="${c}" cy="${y}" r="19" fill="url(#ouro)" stroke="${COR.ouroEscuro}" stroke-width="2"/>
    <circle cx="${c}" cy="${y}" r="12" fill="${gema}"/>
    <circle cx="${c}" cy="${y}" r="12" fill="url(#gemaLuz)"/>`
    : `<path d="${losango(c, y, 9)}" fill="url(#ouro)" stroke="${COR.ouroEscuro}" stroke-width="1.5"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TAM}" height="${TAM}">
  <defs>
    <linearGradient id="ouro" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COR.ouroClaro}"/>
      <stop offset="45%" stop-color="${COR.ouro}"/>
      <stop offset="100%" stop-color="${COR.ouroEscuro}"/>
    </linearGradient>
    <radialGradient id="vinheta" cx="50%" cy="50%" r="50%">
      <stop offset="78%" stop-color="${COR.fundo}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${COR.fundo}" stop-opacity="0.75"/>
    </radialGradient>
    <radialGradient id="gemaLuz" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="#fff" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.35"/>
    </radialGradient>
  </defs>
  <rect x="${x}" y="${y}" width="${lado}" height="${lado}" rx="${raio}" fill="url(#vinheta)"/>
  <rect x="${x - 10}" y="${y - 10}" width="${lado + 20}" height="${lado + 20}" rx="${raio + 8}"
        fill="none" stroke="url(#ouro)" stroke-width="7"/>
  <rect x="${x - 1}" y="${y - 1}" width="${lado + 2}" height="${lado + 2}" rx="${raio}"
        fill="none" stroke="${COR.ouroEscuro}" stroke-width="2"/>
  <rect x="${x + 4}" y="${y + 4}" width="${lado - 8}" height="${lado - 8}" rx="${raio - 4}"
        fill="none" stroke="${COR.ametista}" stroke-opacity="0.55" stroke-width="1.5"/>
    ${orn}
    ${gemaSvg}
</svg>`;
}
