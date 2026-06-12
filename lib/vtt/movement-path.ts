import {
  anchorCandidatesForCell,
  creatureSizeOf,
  isMultiHexCreatureSize,
  occupiedHexes,
  type CreatureSize,
} from "@/lib/vtt/creature-size";
import type { Axial } from "@/lib/vtt/hex-math";
import { pathStepCount } from "@/lib/vtt/hex-path";
import {
  cellsToFeet,
  findPathByFeet,
  reachableAnchorsByFeet,
  withinCentroidFeet,
  type FeetPathOptions,
} from "@/lib/vtt/movement-feet";
import {
  canEnterHex,
  occupancyContext,
  type OccupancyMap,
} from "@/lib/vtt/token-occupancy";
import { blockedHexSet } from "@/lib/vtt/dungeon-layer";
import { axialKey } from "@/lib/vtt/token-occupancy";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import { runRemaining, walkRemaining, type MoveMode } from "@/lib/vtt/movement";

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
): (hex: Axial) => boolean {
  return (hex) => {
    if (blocked?.has(axialKey(hex))) return false;
    return canEnterHex(hex, moverSize, occupancy, gridRadius);
  };
}

function feetPathOpts(
  token: BattleToken,
  mode: MoveMode,
  canEnter: (hex: Axial) => boolean
): FeetPathOptions {
  const maxSteps = mode === "walk" ? walkRemaining(token) : runRemaining(token);
  return {
    maxFeet: cellsToFeet(maxSteps),
    maxSteps,
    canEnter,
  };
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

function expandAnchorsToFootprintHexes(
  anchors: Iterable<Axial>,
  size: CreatureSize
): Axial[] {
  if (!isMultiHexCreatureSize(size)) return [...anchors];
  const map = new Map<string, Axial>();
  for (const anchor of anchors) {
    for (const hex of occupiedHexes(anchor, size)) {
      map.set(axialKey(hex), hex);
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
  const blocked = blockedHexSet({ dungeonObjects: ctx.dungeonObjects });
  const canEnter = canEnterFactory(occupancy, moverSize, ctx.gridRadius, blocked);
  const opts = feetPathOpts(token, mode, canEnter);
  const maxFeet = opts.maxFeet;

  const anchors = anchorCandidatesForCell(target, moverSize);
  let best: Axial[] | null = null;
  for (const anchor of anchors) {
    if (!withinCentroidFeet(token.axial, moverSize, anchor, maxFeet)) continue;
    const path = findPathByFeet(token.axial, anchor, opts);
    if (path && (!best || pathStepCount(path) < pathStepCount(best))) best = path;
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
  const blocked = blockedHexSet(scene);
  const canEnter = canEnterFactory(occupancy, moverSize, scene.gridRadius, blocked);
  return { canEnter, moverSize };
}

export function reachableMovementHexes(
  token: BattleToken,
  mode: MoveMode,
  scene: Pick<BattleScene, "tokens" | "gridRadius" | "dungeonObjects">,
  actorRacas?: Record<string, string | undefined>
): Axial[] {
  return reachableAnchorsWithinFeet(token, mode, scene, actorRacas);
}

/** Células do corpo alcançáveis (pés ao redor do centro) — PCs e monstros multi-hex. */
export function reachableMovementFootprintHexes(
  token: BattleToken,
  mode: MoveMode,
  scene: Pick<BattleScene, "tokens" | "gridRadius" | "dungeonObjects">,
  actorRacas?: Record<string, string | undefined>
): Axial[] {
  const anchors = reachableMovementHexes(token, mode, scene, actorRacas);
  const moverRaca = token.actorId ? actorRacas?.[token.actorId] : undefined;
  const size = creatureSizeOf(token, moverRaca);
  return expandAnchorsToFootprintHexes(anchors, size);
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
