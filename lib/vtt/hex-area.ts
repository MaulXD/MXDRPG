import type { Axial } from "@/lib/vtt/hex-math";
import { HEX_DIRECTIONS, hexNeighbors, hexesInRange } from "@/lib/vtt/hex-math";

export type AreaShape = "single" | "burst" | "wall" | "cone" | "line" | "cube";

export function areaNeedsDirection(shape: AreaShape): boolean {
  return shape === "cone" || shape === "line";
}

function axialStep(from: Axial, dirIdx: number, steps = 1): Axial {
  const d = HEX_DIRECTIONS[dirIdx % 6];
  return { q: from.q + d.q * steps, r: from.r + d.r * steps };
}

/** Linha de `lengthHex` hex a partir do centro na direção 0–5. */
export function lineHexes(center: Axial, directionIdx: number, lengthHex: number): Axial[] {
  const len = Math.max(1, lengthHex);
  const out: Axial[] = [];
  for (let i = 1; i <= len; i++) {
    out.push(axialStep(center, directionIdx, i));
  }
  return out;
}

/** Cone hex: abre 60° na direção escolhida. */
export function coneHexes(center: Axial, directionIdx: number, lengthHex: number): Axial[] {
  const len = Math.max(1, lengthHex);
  const map = new Map<string, Axial>();
  const key = (a: Axial) => `${a.q},${a.r}`;
  map.set(key(center), center);

  for (let dist = 1; dist <= len; dist++) {
    const tip = axialStep(center, directionIdx, dist);
    map.set(key(tip), tip);
    const left = (directionIdx + 5) % 6;
    const right = (directionIdx + 1) % 6;
    for (let w = 1; w < dist; w++) {
      const l = axialStep(tip, left, w);
      const r = axialStep(tip, right, w);
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
    const count = opts.hexCount ?? 3;
    const cells = [center, ...hexNeighbors(center)];
    return cells.slice(0, count);
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
