import type { Axial } from "@/lib/vtt/grid-math";
import {
  GRID_DIRECTION_COUNT,
  GRID_DIRECTIONS,
  cellsInRange,
} from "@/lib/vtt/grid-math";

export type AreaShape = "single" | "burst" | "wall" | "cone" | "line" | "cube";

export function areaNeedsDirection(shape: AreaShape): boolean {
  return shape === "cone" || shape === "line" || shape === "wall";
}

/** Cone e linha partem do conjurador; muralha e explosões usam o centro clicado. */
export function areaUsesCasterOrigin(shape: AreaShape): boolean {
  return shape === "cone" || shape === "line";
}

function axialStep(from: Axial, dirIdx: number, steps = 1): Axial {
  const d = GRID_DIRECTIONS[dirIdx % GRID_DIRECTION_COUNT]!;
  return { q: from.q + d.q * steps, r: from.r + d.r * steps };
}

/** Perpendicular à direção (rotação 90° no grid). */
function perpDirection(dirIdx: number): Axial {
  const d = GRID_DIRECTIONS[dirIdx % GRID_DIRECTION_COUNT]!;
  return { q: -d.r, r: d.q };
}

/** Linha de células a partir do centro na direção 0–7. */
export function lineCells(center: Axial, directionIdx: number, lengthCells: number): Axial[] {
  const len = Math.max(1, lengthCells);
  const out: Axial[] = [];
  for (let i = 1; i <= len; i++) {
    out.push(axialStep(center, directionIdx, i));
  }
  return out;
}

/** Cone no grid quadrado: alarga 1 célula por passo na direção escolhida. */
export function coneCells(center: Axial, directionIdx: number, lengthCells: number): Axial[] {
  const len = Math.max(1, lengthCells);
  const map = new Map<string, Axial>();
  const key = (a: Axial) => `${a.q},${a.r}`;
  map.set(key(center), center);

  const perp = perpDirection(directionIdx);
  for (let dist = 1; dist <= len; dist++) {
    const tip = axialStep(center, directionIdx, dist);
    map.set(key(tip), tip);
    for (let w = 1; w < dist; w++) {
      const l = { q: tip.q + perp.q * w, r: tip.r + perp.r * w };
      const r = { q: tip.q - perp.q * w, r: tip.r - perp.r * w };
      map.set(key(l), l);
      map.set(key(r), r);
    }
  }
  return [...map.values()];
}

export function computeAreaCells(opts: {
  center: Axial;
  shape: AreaShape;
  radiusCells?: number;
  cellCount?: number;
  lengthCells?: number;
  direction?: number | null;
}): Axial[] {
  const { center, shape } = opts;

  if (shape === "burst" || shape === "cube") {
    const r = Math.max(1, opts.radiusCells ?? opts.lengthCells ?? 1);
    return cellsInRange(center, r);
  }

  if (shape === "wall") {
    const count = Math.max(1, opts.cellCount ?? 3);
    const dir = opts.direction ?? 0;
    const out: Axial[] = [];
    for (let i = 0; i < count; i++) {
      out.push(axialStep(center, dir, i));
    }
    return out;
  }

  if (shape === "line") {
    const dir = opts.direction ?? 0;
    return lineCells(center, dir, opts.lengthCells ?? opts.radiusCells ?? 3);
  }

  if (shape === "cone") {
    const dir = opts.direction ?? 0;
    return coneCells(center, dir, opts.lengthCells ?? opts.radiusCells ?? 2);
  }

  return [center];
}
