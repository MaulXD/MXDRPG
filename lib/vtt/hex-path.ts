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

/** Caminho mais curto no grid (BFS, 8 direções); inclui origem e destino. */
export function findHexPath(from: Axial, to: Axial, opts: PathfindOptions): Axial[] | null {
  if (from.q === to.q && from.r === to.r) return [from];

  const startKey = axialKey(from);
  const goalKey = axialKey(to);
  const parent = new Map<string, Axial>();
  const dist = new Map<string, number>();
  dist.set(startKey, 0);
  const queue: Axial[] = [from];
  let head = 0;

  while (head < queue.length) {
    const cur = queue[head++]!;
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

function reachableBfsDist(
  from: Axial,
  maxSteps: number,
  canEnter: (hex: Axial) => boolean
): Map<string, number> {
  const dist = new Map<string, number>();
  if (maxSteps <= 0) return dist;
  dist.set(axialKey(from), 0);
  const queue: Axial[] = [from];
  let head = 0;

  while (head < queue.length) {
    const cur = queue[head++]!;
    const curKey = axialKey(cur);
    const curDist = dist.get(curKey) ?? 0;
    if (curDist >= maxSteps) continue;

    for (const n of hexNeighbors(cur)) {
      const nk = axialKey(n);
      if (dist.has(nk)) continue;
      if (!canEnter(n)) continue;
      dist.set(nk, curDist + 1);
      queue.push(n);
    }
  }

  return dist;
}

/** Células alcançáveis em até maxSteps passos (BFS com bloqueio). */
export function reachableHexesBfs(
  from: Axial,
  maxSteps: number,
  canEnter: (hex: Axial) => boolean
): Axial[] {
  const dist = reachableBfsDist(from, maxSteps, canEnter);
  const result: Axial[] = [];
  for (const [key, steps] of dist) {
    if (steps > 0) {
      const [q, r] = key.split(",").map(Number);
      result.push({ q, r });
    }
  }
  return result;
}

/** Distância em passos por célula alcançável (inclui origem com 0). */
export function reachableHexesBfsWithDist(
  from: Axial,
  maxSteps: number,
  canEnter: (hex: Axial) => boolean
): Map<string, number> {
  return reachableBfsDist(from, maxSteps, canEnter);
}
