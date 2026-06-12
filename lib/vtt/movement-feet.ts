import type { Axial } from "@/lib/vtt/hex-math";
import { hexNeighbors } from "@/lib/vtt/hex-math";
import { footprintCenter, type CreatureSize } from "@/lib/vtt/creature-size";

/** D&D 5e — 1 célula do grid ≈ 5 ft (mesa: 1,5 m). */
export const FEET_PER_CELL = 5;

export type FeetPathOptions = {
  maxFeet: number;
  /** Teto em passos (walk/run da ficha) — PA e orçamento de células. */
  maxSteps: number;
  canEnter: (hex: Axial) => boolean;
};

export type ReachByFeet = Map<string, { feet: number; steps: number }>;

function stateKey(q: number, r: number, parity: 0 | 1): string {
  return `${q},${r},${parity}`;
}

export function stepFeetAndParity(
  from: Axial,
  to: Axial,
  diagonalParity: 0 | 1
): { feet: number; nextParity: 0 | 1 } {
  const isDiag = from.q !== to.q && from.r !== to.r;
  if (!isDiag) return { feet: FEET_PER_CELL, nextParity: diagonalParity };
  return {
    feet: diagonalParity === 0 ? FEET_PER_CELL : FEET_PER_CELL * 2,
    nextParity: (1 - diagonalParity) as 0 | 1,
  };
}

export function pathFeetCost(path: Axial[]): number {
  if (path.length < 2) return 0;
  let total = 0;
  let parity: 0 | 1 = 0;
  for (let i = 1; i < path.length; i++) {
    const { feet, nextParity } = stepFeetAndParity(path[i - 1]!, path[i]!, parity);
    total += feet;
    parity = nextParity;
  }
  return total;
}

export function cellsToFeet(cells: number): number {
  return cells * FEET_PER_CELL;
}

/** Distância em pés entre centros de dois footprints (alcance “ao redor” do corpo). */
export function feetBetweenCenters(
  aAnchor: Axial,
  aSize: CreatureSize,
  bAnchor: Axial,
  bSize: CreatureSize
): number {
  const a = footprintCenter(aAnchor, aSize);
  const b = footprintCenter(bAnchor, bSize);
  return Math.hypot(a.q - b.q, a.r - b.r) * FEET_PER_CELL;
}

export function withinCentroidFeet(
  originAnchor: Axial,
  size: CreatureSize,
  destAnchor: Axial,
  maxFeet: number
): boolean {
  return feetBetweenCenters(originAnchor, size, destAnchor, size) <= maxFeet + 0.001;
}

type SearchNode = {
  q: number;
  r: number;
  parity: 0 | 1;
  feet: number;
  steps: number;
};

function reconstructPath(
  parent: Map<string, Axial>,
  goal: Axial,
  start: Axial
): Axial[] {
  const path: Axial[] = [goal];
  let k = `${goal.q},${goal.r}`;
  const startKey = `${start.q},${start.r}`;
  while (k !== startKey) {
    const p = parent.get(k);
    if (!p) return [];
    path.unshift(p);
    k = `${p.q},${p.r}`;
  }
  return path;
}

/** Caminho mais curto em pés (D&D: ortogonal 5 ft; diagonais alternam 5 ft / 10 ft). */
export function findPathByFeet(from: Axial, to: Axial, opts: FeetPathOptions): Axial[] | null {
  if (from.q === to.q && from.r === to.r) return [from];
  if (!opts.canEnter(to)) return null;

  const parent = new Map<string, Axial>();
  const bestFeet = new Map<string, number>();
  const startNodeKey = stateKey(from.q, from.r, 0);
  bestFeet.set(startNodeKey, 0);

  const open: SearchNode[] = [{ q: from.q, r: from.r, parity: 0, feet: 0, steps: 0 }];
  let bestGoalFeet = Infinity;
  let foundGoal = false;

  while (open.length) {
    open.sort((a, b) => a.feet - b.feet);
    const cur = open.shift()!;
    const curNodeKey = stateKey(cur.q, cur.r, cur.parity);
    const recorded = bestFeet.get(curNodeKey);
    if (recorded == null || cur.feet > recorded) continue;

    if (cur.q === to.q && cur.r === to.r) {
      if (cur.feet < bestGoalFeet) {
        bestGoalFeet = cur.feet;
        foundGoal = true;
      }
      continue;
    }

    if (foundGoal && cur.feet >= bestGoalFeet) continue;

    for (const n of hexNeighbors({ q: cur.q, r: cur.r })) {
      if (!opts.canEnter(n)) continue;
      const { feet: edgeFeet, nextParity } = stepFeetAndParity(
        { q: cur.q, r: cur.r },
        n,
        cur.parity
      );
      const nextFeet = cur.feet + edgeFeet;
      const nextSteps = cur.steps + 1;
      if (nextFeet > opts.maxFeet || nextSteps > opts.maxSteps) continue;

      const nextKey = stateKey(n.q, n.r, nextParity);
      const prev = bestFeet.get(nextKey);
      if (prev != null && nextFeet >= prev) continue;

      bestFeet.set(nextKey, nextFeet);
      parent.set(`${n.q},${n.r}`, { q: cur.q, r: cur.r });
      open.push({ q: n.q, r: n.r, parity: nextParity, feet: nextFeet, steps: nextSteps });
    }
  }

  if (!foundGoal) return null;
  return reconstructPath(parent, to, from);
}

/** Âncoras alcançáveis dentro do orçamento em pés (e passos). */
export function reachableAnchorsByFeet(from: Axial, opts: FeetPathOptions): ReachByFeet {
  const result: ReachByFeet = new Map();
  const bestFeet = new Map<string, number>();
  const startNodeKey = stateKey(from.q, from.r, 0);
  bestFeet.set(startNodeKey, 0);

  const open: SearchNode[] = [{ q: from.q, r: from.r, parity: 0, feet: 0, steps: 0 }];

  while (open.length) {
    open.sort((a, b) => a.feet - b.feet);
    const cur = open.shift()!;
    const curNodeKey = stateKey(cur.q, cur.r, cur.parity);
    const recorded = bestFeet.get(curNodeKey);
    if (recorded == null || cur.feet > recorded) continue;

    const axialKey = `${cur.q},${cur.r}`;
    if (cur.steps > 0) {
      const prevFeet = result.get(axialKey)?.feet ?? Infinity;
      if (cur.feet < prevFeet) {
        result.set(axialKey, { feet: cur.feet, steps: cur.steps });
      }
    }

    for (const n of hexNeighbors({ q: cur.q, r: cur.r })) {
      if (!opts.canEnter(n)) continue;
      const { feet: edgeFeet, nextParity } = stepFeetAndParity(
        { q: cur.q, r: cur.r },
        n,
        cur.parity
      );
      const nextFeet = cur.feet + edgeFeet;
      const nextSteps = cur.steps + 1;
      if (nextFeet > opts.maxFeet || nextSteps > opts.maxSteps) continue;

      const nextKey = stateKey(n.q, n.r, nextParity);
      const prev = bestFeet.get(nextKey);
      if (prev != null && nextFeet >= prev) continue;

      bestFeet.set(nextKey, nextFeet);
      open.push({ q: n.q, r: n.r, parity: nextParity, feet: nextFeet, steps: nextSteps });
    }
  }

  return result;
}
