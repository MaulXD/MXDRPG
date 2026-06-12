import type { Axial } from "@/lib/vtt/hex-math";
import {
  GRID_DIRECTION_COUNT,
  HEX_DIRECTIONS,
  hexesInRange,
} from "@/lib/vtt/hex-math";

export type AreaShape = "single" | "burst" | "wall" | "cone" | "line" | "cube";

export function areaNeedsDirection(shape: AreaShape): boolean {
  return shape === "cone" || shape === "line" || shape === "wall";
}

/** Cone e linha partem do conjurador; muralha e explosões usam o centro clicado. */
export function areaUsesCasterOrigin(shape: AreaShape): boolean {
  return shape === "cone" || shape === "line";
}

function axialStep(from: Axial, dirIdx: number, steps = 1): Axial {
  const d = HEX_DIRECTIONS[dirIdx % GRID_DIRECTION_COUNT]!;
  return { q: from.q + d.q * steps, r: from.r + d.r * steps };
}

/** Perpendicular à direção (rotação 90° no grid). */
function perpDirection(dirIdx: number): Axial {
  const d = HEX_DIRECTIONS[dirIdx % GRID_DIRECTION_COUNT]!;
  return { q: -d.r, r: d.q };
}

/** Linha de células a partir do centro na direção 0–7. */
export function lineHexes(center: Axial, directionIdx: number, lengthHex: number): Axial[] {
  const len = Math.max(1, lengthHex);
  const out: Axial[] = [];
  for (let i = 1; i <= len; i++) {
    out.push(axialStep(center, directionIdx, i));
  }
  return out;
}

/** Cone no grid quadrado: alarga 1 célula por passo na direção escolhida. */
export function coneHexes(center: Axial, directionIdx: number, lengthHex: number): Axial[] {
  const len = Math.max(1, lengthHex);
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

export function computeAreaHexes(opts: {
  center: Axial;
  shape: AreaShape;
  radiusHex?: number;
  hexCount?: number;
  lengthHex?: number;
  direction?: number | null;
}): Axial[] {
  const { center, shape } = opts;

  if (shape === "burst" || shape === "cube") {
    const r = Math.max(1, opts.radiusHex ?? opts.lengthHex ?? 1);
    return hexesInRange(center, r);
  }

  if (shape === "wall") {
    const count = Math.max(1, opts.hexCount ?? 3);
    const dir = opts.direction ?? 0;
    const out: Axial[] = [];
    for (let i = 0; i < count; i++) {
      out.push(axialStep(center, dir, i));
    }
    return out;
  }

  if (shape === "line") {
    const dir = opts.direction ?? 0;
    return lineHexes(center, dir, opts.lengthHex ?? opts.radiusHex ?? 3);
  }

  if (shape === "cone") {
    const dir = opts.direction ?? 0;
    return coneHexes(center, dir, opts.lengthHex ?? opts.radiusHex ?? 2);
  }

  return [center];
}
