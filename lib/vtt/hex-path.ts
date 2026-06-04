import type { Axial } from "@/lib/vtt/hex-math";
import { axialKey } from "@/lib/vtt/token-occupancy";
import { hexNeighbors } from "@/lib/vtt/hex-math";

export function pathStepCount(path: Axial[]): number {
  return Math.max(0, path.length - 1);
}

export type PathfindOptions = {
  maxSteps: number;
  canEnter: (hex: Axial) => boolean;
};

/** Caminho mais curto em hex (BFS); inclui origem e destino. */
export function findHexPath(from: Axial, to: Axial, opts: PathfindOptions): Axial[] | null {
  if (from.q === to.q && from.r === to.r) return [from];

  const startKey = axialKey(from);
  const goalKey = axialKey(to);
  const parent = new Map<string, Axial>();
  const dist = new Map<string, number>();
  dist.set(startKey, 0);
  const queue: Axial[] = [from];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curKey = axialKey(cur);
    const curDist = dist.get(curKey) ?? 0;
    if (curKey === goalKey) {
      const path: Axial[] = [to];
      let k = goalKey;
      while (k !== startKey) {
        const p = parent.get(k);
        if (!p) return null;
        path.unshift(p);
        k = axialKey(p);
      }
      return path;
    }
    if (curDist >= opts.maxSteps) continue;

    for (const n of hexNeighbors(cur)) {
      const nk = axialKey(n);
      if (dist.has(nk)) continue;
      if (!opts.canEnter(n)) continue;

      dist.set(nk, curDist + 1);
      parent.set(nk, cur);
      queue.push(n);
    }
  }

  return null;
}

/** Hexes alcançáveis em até maxSteps passos (BFS com bloqueio). */
export function reachableHexesBfs(
  from: Axial,
  maxSteps: number,
  canEnter: (hex: Axial) => boolean
): Axial[] {
  if (maxSteps <= 0) return [];
  const result: Axial[] = [];
  const dist = new Map<string, number>();
  dist.set(axialKey(from), 0);
  const queue: Axial[] = [from];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curKey = axialKey(cur);
    const curDist = dist.get(curKey) ?? 0;
    if (curDist > 0) result.push(cur);
    if (curDist >= maxSteps) continue;

    for (const n of hexNeighbors(cur)) {
      const nk = axialKey(n);
      if (dist.has(nk)) continue;
      if (!canEnter(n)) continue;
      dist.set(nk, curDist + 1);
      queue.push(n);
    }
  }

  return result;
}
