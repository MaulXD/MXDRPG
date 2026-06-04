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
