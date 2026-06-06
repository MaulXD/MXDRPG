import type { Axial } from "@/lib/vtt/hex-math";

/** Células axiais dentro do raio da cena */
export function buildHexGrid(gridRadius: number): Axial[] {
  const cells: Axial[] = [];
  const R = gridRadius;
  for (let q = -R; q <= R; q++) {
    for (let r = Math.max(-R, -q - R); r <= Math.min(R, -q + R); r++) {
      cells.push({ q, r });
    }
  }
  return cells;
}

/** Raio axial necessário para cobrir o retângulo visível do canvas (com zoom). */
export function viewportGridRadius(
  w: number,
  h: number,
  hexSize: number,
  viewScale = 1
): number {
  const effW = Math.max(w, 1) / Math.max(viewScale, 0.01);
  const effH = Math.max(h, 1) / Math.max(viewScale, 0.01);
  const cols = effW / (hexSize * Math.sqrt(3));
  const rows = effH / (hexSize * 1.5);
  return Math.ceil(Math.max(cols, rows) / 2) + 3;
}

/** Grid da cena expandido até preencher o viewport. */
export function buildDisplayHexGrid(
  sceneRadius: number,
  w: number,
  h: number,
  hexSize: number,
  viewScale = 1
): Axial[] {
  const r = Math.max(sceneRadius, viewportGridRadius(w, h, hexSize, viewScale));
  return buildHexGrid(r);
}
