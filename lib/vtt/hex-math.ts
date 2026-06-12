/** Célula do grid (q = coluna, r = linha). Nomes legados `Axial` / `hex*` mantidos na API. */
export type Axial = { q: number; r: number };

/** Centro da célula em pixels (`size` = lado do quadrado). */
export function axialToPixel(q: number, r: number, size: number, offsetX: number, offsetY: number) {
  const x = offsetX + (q + 0.5) * size;
  const y = offsetY + (r + 0.5) * size;
  return { x, y };
}

export function pixelToAxial(x: number, y: number, size: number, offsetX: number, offsetY: number): Axial {
  const px = x - offsetX;
  const py = y - offsetY;
  const q = Math.floor(px / size);
  const r = Math.floor(py / size);
  return { q, r };
}

export function axialRound(q: number, r: number): Axial {
  return { q: Math.round(q), r: Math.round(r) };
}

/** Distância em passos (8 direções, Chebyshev — 1 passo = 1 célula). */
export function axialDistance(a: Axial, b: Axial): number {
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r));
}

/** Células dentro do alcance (quadrado Chebyshev). */
export function hexesInRange(origin: Axial, range: number): Axial[] {
  const result: Axial[] = [];
  for (let dq = -range; dq <= range; dq++) {
    for (let dr = -range; dr <= range; dr++) {
      if (Math.max(Math.abs(dq), Math.abs(dr)) <= range) {
        result.push({ q: origin.q + dq, r: origin.r + dr });
      }
    }
  }
  return result;
}

/** 8 direções no grid (E, SE, S, SW, W, NW, N, NE). */
export const HEX_DIRECTIONS: Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: 1 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: -1, r: -1 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

export const GRID_DIRECTION_COUNT = HEX_DIRECTIONS.length;

export function hexNeighbors(a: Axial): Axial[] {
  return HEX_DIRECTIONS.map((d) => ({ q: a.q + d.q, r: a.r + d.r }));
}

export function hexDirection(from: Axial, to: Axial): number | null {
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  const idx = HEX_DIRECTIONS.findIndex((d) => d.q === dq && d.r === dr);
  return idx >= 0 ? idx : null;
}

/** Meio lado da célula (raio do quadrado desenhado). */
export function hexDrawRadius(hexSize: number): number {
  return hexSize / 2;
}

export function hexCorners(cx: number, cy: number, halfSize: number): { x: number; y: number }[] {
  const hs = halfSize;
  return [
    { x: cx - hs, y: cy - hs },
    { x: cx + hs, y: cy - hs },
    { x: cx + hs, y: cy + hs },
    { x: cx - hs, y: cy + hs },
  ];
}

/** Célula dentro do mapa quadrado centrado na origem. */
export function inSquareGrid(hex: Axial, gridRadius: number): boolean {
  return Math.abs(hex.q) <= gridRadius && Math.abs(hex.r) <= gridRadius;
}
