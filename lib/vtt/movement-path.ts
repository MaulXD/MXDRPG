import {
  anchorCandidatesForCell,
  creatureSizeOf,
  isMultiCellCreatureSize,
  occupiedCells,
  type CreatureSize,
} from "@/lib/vtt/creature-size";
import type { Axial } from "@/lib/vtt/grid-math";
import { pathStepCount } from "@/lib/vtt/grid-path";
import {
  cellsToFeet,
  findPathByFeet,
  reachableAnchorsByFeet,
  withinCentroidFeet,
  type FeetPathOptions,
} from "@/lib/vtt/movement-feet";
import {
  canEnterCell,
  occupancyContext,
  type OccupancyMap,
} from "@/lib/vtt/token-occupancy";
import { blockedCellSet } from "@/lib/vtt/dungeon-layer";
import { axialKey } from "@/lib/vtt/token-occupancy";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import { runRemaining, walkRemaining, type MoveMode } from "@/lib/vtt/movement";

/** Teto de passos no pathfind — evita explosão com walk/run corrompidos. */
export const PATHFIND_MAX_STEPS = 32;

export type MovementPathContext = {
  tokens: BattleToken[];
  gridRadius: number;
  actorRacas?: Record<string, string | undefined>;
  dungeonObjects?: BattleScene["dungeonObjects"];
};

function canEnterFactory(
  occupancy: OccupancyMap,
  moverSize: ReturnType<typeof occupancyContext>["moverSize"],
  gridRadius: number,
  blocked?: Set<string>
): (cell: Axial) => boolean {
  return (cell) => {
    if (blocked?.has(axialKey(cell))) return false;
    return canEnterCell(cell, moverSize, occupancy, gridRadius);
  };
}

function feetPathOpts(
  token: BattleToken,
  mode: MoveMode,
  canEnter: (cell: Axial) => boolean
): FeetPathOptions {
  const rawSteps = mode === "walk" ? walkRemaining(token) : runRemaining(token);
  const bounded = Number.isFinite(rawSteps) ? Math.max(0, Math.floor(rawSteps)) : 0;
  const maxSteps = Math.min(PATHFIND_MAX_STEPS, bounded);
  return {
    maxFeet: cellsToFeet(maxSteps),
    maxSteps,
    canEnter,
  };
}

export type ReachabilityBundle = {
  distMap: Map<string, number>;
  footprintKeys: Set<string>;
};

/** Um passe de BFS em pés → mapa de distâncias + células do footprint alcançáveis. */
export function reachabilityBundle(
  token: BattleToken,
  mode: MoveMode,
  scene: Pick<BattleScene, "tokens" | "gridRadius" | "dungeonObjects">,
  actorRacas?: Record<string, string | undefined>
): ReachabilityBundle {
  const { canEnter, moverSize } = movementReachContext(token, scene, actorRacas);
  const opts = feetPathOpts(token, mode, canEnter);
  const reachMap = reachableAnchorsByFeet(token.axial, opts);
  const distMap = new Map<string, number>();
  const anchors: Axial[] = [];
  for (const [key, { steps }] of reachMap) {
    if (steps <= 0) continue;
    const [q, r] = key.split(",").map(Number);
    const anchor = { q, r };
    if (!withinCentroidFeet(token.axial, moverSize, anchor, opts.maxFeet)) continue;
    distMap.set(key, steps);
    anchors.push(anchor);
  }
  const moverRaca = token.actorId ? actorRacas?.[token.actorId] : undefined;
  const size = creatureSizeOf(token, moverRaca);
  const footprintKeys = new Set(
    expandAnchorsToFootprintCells(anchors, size).map((cell) => axialKey(cell))
  );
  return { distMap, footprintKeys };
}

function reachableAnchorsWithinFeet(
  token: BattleToken,
  mode: MoveMode,
  scene: Pick<BattleScene, "tokens" | "gridRadius" | "dungeonObjects">,
  actorRacas?: Record<string, string | undefined>
): Axial[] {
  const { canEnter, moverSize } = movementReachContext(token, scene, actorRacas);
  const opts = feetPathOpts(token, mode, canEnter);
  const reachMap = reachableAnchorsByFeet(token.axial, opts);
  const result: Axial[] = [];
  for (const [key, { steps }] of reachMap) {
    if (steps <= 0) continue;
    const [q, r] = key.split(",").map(Number);
    const anchor = { q, r };
    if (!withinCentroidFeet(token.axial, moverSize, anchor, opts.maxFeet)) continue;
    result.push(anchor);
  }
  return result;
}

/** Âncora NW final após clicar numa célula (inclui monstros multi-célula). */
export function resolveMovementAnchor(
  token: BattleToken,
  target: Axial,
  mode: MoveMode,
  ctx: MovementPathContext
): Axial | null {
  const path = movementPathTo(token, target, mode, ctx);
  if (!path?.length) return null;
  return path[path.length - 1] ?? null;
}

function expandAnchorsToFootprintCells(
  anchors: Iterable<Axial>,
  size: CreatureSize
): Axial[] {
  if (!isMultiCellCreatureSize(size)) return [...anchors];
  const map = new Map<string, Axial>();
  for (const anchor of anchors) {
    for (const cell of occupiedCells(anchor, size)) {
      map.set(axialKey(cell), cell);
    }
  }
  return [...map.values()];
}

export function movementPathTo(
  token: BattleToken,
  target: Axial,
  mode: MoveMode,
  ctx: MovementPathContext
): Axial[] | null {
  const { occupancy, moverSize } = occupancyContext(ctx.tokens, token, ctx.actorRacas);
  const blocked = blockedCellSet({ dungeonObjects: ctx.dungeonObjects });
  const canEnter = canEnterFactory(occupancy, moverSize, ctx.gridRadius, blocked);
  const opts = feetPathOpts(token, mode, canEnter);
  const maxFeet = opts.maxFeet;
  if (maxFeet <= 0) return null;

  const anchors = anchorCandidatesForCell(target, moverSize);
  let best: Axial[] | null = null;
  let bestSteps = Infinity;
  for (const anchor of anchors) {
    if (!withinCentroidFeet(token.axial, moverSize, anchor, maxFeet)) continue;
    const path = findPathByFeet(token.axial, anchor, opts);
    if (!path) continue;
    const steps = pathStepCount(path);
    if (steps < bestSteps) {
      bestSteps = steps;
      best = path;
      if (steps <= 1) break;
    }
  }
  return best;
}

export function movementPathDistance(
  token: BattleToken,
  target: Axial,
  mode: MoveMode,
  ctx: MovementPathContext
): number | null {
  const path = movementPathTo(token, target, mode, ctx);
  if (!path) return null;
  return pathStepCount(path);
}

function movementReachContext(
  token: BattleToken,
  scene: Pick<BattleScene, "tokens" | "gridRadius" | "dungeonObjects">,
  actorRacas?: Record<string, string | undefined>
) {
  const { occupancy, moverSize } = occupancyContext(scene.tokens, token, actorRacas);
  const blocked = blockedCellSet(scene);
  const canEnter = canEnterFactory(occupancy, moverSize, scene.gridRadius, blocked);
  return { canEnter, moverSize };
}

export function reachableMovementCells(
  token: BattleToken,
  mode: MoveMode,
  scene: Pick<BattleScene, "tokens" | "gridRadius" | "dungeonObjects">,
  actorRacas?: Record<string, string | undefined>
): Axial[] {
  return reachableAnchorsWithinFeet(token, mode, scene, actorRacas);
}

/** Células do corpo alcançáveis (pés ao redor do centro) — PCs e monstros multi-célula. */
export function reachableMovementFootprintCells(
  token: BattleToken,
  mode: MoveMode,
  scene: Pick<BattleScene, "tokens" | "gridRadius" | "dungeonObjects">,
  actorRacas?: Record<string, string | undefined>
): Axial[] {
  const anchors = reachableMovementCells(token, mode, scene, actorRacas);
  const moverRaca = token.actorId ? actorRacas?.[token.actorId] : undefined;
  const size = creatureSizeOf(token, moverRaca);
  return expandAnchorsToFootprintCells(anchors, size);
}

/** Distância em passos por célula-âncora alcançável (orçamento em pés + centro do corpo). */
export function reachableMovementDistances(
  token: BattleToken,
  mode: MoveMode,
  scene: Pick<BattleScene, "tokens" | "gridRadius" | "dungeonObjects">,
  actorRacas?: Record<string, string | undefined>
): Map<string, number> {
  const { canEnter, moverSize } = movementReachContext(token, scene, actorRacas);
  const opts = feetPathOpts(token, mode, canEnter);
  const reachMap = reachableAnchorsByFeet(token.axial, opts);
  const dist = new Map<string, number>();
  for (const [key, { steps }] of reachMap) {
    if (steps <= 0) continue;
    const [q, r] = key.split(",").map(Number);
    if (!withinCentroidFeet(token.axial, moverSize, { q, r }, opts.maxFeet)) continue;
    dist.set(key, steps);
  }
  return dist;
}
