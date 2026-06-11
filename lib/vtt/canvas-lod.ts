import { DISPLAY_GRID_RADIUS_CAP } from "@/lib/vtt/hex-grid";

/** Abaixo disso: grade e névoa em modo leve (menos traços/preenchimentos). */
export const LOD_LIGHT_SCALE = 0.7;

/** Zoom bem afastado: amostragem da grade base + teto de raio menor. */
export const LOD_DEEP_SCALE = 0.55;

export type GridLod = "full" | "light" | "deep";

export function gridLodLevel(viewScale: number): GridLod {
  if (viewScale < LOD_DEEP_SCALE) return "deep";
  if (viewScale < LOD_LIGHT_SCALE) return "light";
  return "full";
}

/** Teto de raio do grid conforme zoom — reduz contagem de células no zoom out. */
export function lodDisplayGridRadiusCap(viewScale: number): number {
  if (viewScale < LOD_DEEP_SCALE) return Math.min(DISPLAY_GRID_RADIUS_CAP, 18);
  if (viewScale < LOD_LIGHT_SCALE) return Math.min(DISPLAY_GRID_RADIUS_CAP, 20);
  return DISPLAY_GRID_RADIUS_CAP;
}

/** Em LOD profundo, desenha só metade dos hexes base (xadrez) para aliviar CPU. */
export function skipLodDeepBaseHex(q: number, r: number): boolean {
  return ((q + r) & 1) !== 0;
}
