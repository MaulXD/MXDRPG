/** Coordenadas axiais (q, r) — grid hex pointy-top */
export type Axial = { q: number; r: number };

export function axialToPixel(q: number, r: number, size: number, offsetX: number, offsetY: number) {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r) + offsetX;
  const y = size * ((3 / 2) * r) + offsetY;
  return { x, y };
}

export function pixelToAxial(x: number, y: number, size: number, offsetX: number, offsetY: number): Axial {
  const px = x - offsetX;
  const py = y - offsetY;
  const q = ((Math.sqrt(3) / 3) * px - (1 / 3) * py) / size;
  const r = ((2 / 3) * py) / size;
  return axialRound(q, r);
}

export function axialRound(q: number, r: number): Axial {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs;
  else if (rDiff > sDiff) rr = -rq - rs;
  return { q: rq, r: rr };
}

export function axialDistance(a: Axial, b: Axial): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/** Anel de hexes a distância exata (BFS) */
export function hexesInRange(origin: Axial, range: number): Axial[] {
  const result: Axial[] = [];
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      const cell = { q: origin.q + q, r: origin.r + r };
      if (axialDistance(origin, cell) <= range) result.push(cell);
    }
  }
  return result;
}

export const HEX_DIRECTIONS: Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexNeighbors(a: Axial): Axial[] {
  return HEX_DIRECTIONS.map((d) => ({ q: a.q + d.q, r: a.r + d.r }));
}

export function hexDirection(from: Axial, to: Axial): number | null {
  const dq = to.q - from.q;
  const dr = to.r - from.r;
  const idx = HEX_DIRECTIONS.findIndex((d) => d.q === dq && d.r === dr);
  return idx >= 0 ? idx : null;
}

export function hexCorners(cx: number, cy: number, size: number): { x: number; y: number }[] {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    corners.push({ x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) });
  }
  return corners;
}
