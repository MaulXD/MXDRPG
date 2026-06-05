import type { Axial } from "@/lib/vtt/hex-math";
import { findHexPath, pathStepCount, reachableHexesBfs } from "@/lib/vtt/hex-path";
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

export function movementPathTo(
  token: BattleToken,
  target: Axial,
  mode: MoveMode,
  ctx: MovementPathContext
): Axial[] | null {
  const maxSteps = mode === "walk" ? walkRemaining(token) : runRemaining(token);
  const { occupancy, moverSize } = occupancyContext(ctx.tokens, token, ctx.actorRacas);
  const blocked = blockedHexSet({ dungeonObjects: ctx.dungeonObjects });
  const canEnter = canEnterFactory(occupancy, moverSize, ctx.gridRadius, blocked);
  return findHexPath(token.axial, target, { maxSteps, canEnter });
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

export function reachableMovementHexes(
  token: BattleToken,
  mode: MoveMode,
  scene: Pick<BattleScene, "tokens" | "gridRadius" | "dungeonObjects">,
  actorRacas?: Record<string, string | undefined>
): Axial[] {
  const maxSteps = mode === "walk" ? walkRemaining(token) : runRemaining(token);
  const { occupancy, moverSize } = occupancyContext(scene.tokens, token, actorRacas);
  const blocked = blockedHexSet(scene);
  const canEnter = canEnterFactory(occupancy, moverSize, scene.gridRadius, blocked);
  return reachableHexesBfs(token.axial, maxSteps, canEnter);
}
