import type { Axial } from "@/lib/vtt/hex-math";
import { findHexPath, pathStepCount, reachableHexesBfs } from "@/lib/vtt/hex-path";
import {
  canEnterHex,
  occupancyContext,
  type OccupancyMap,
} from "@/lib/vtt/token-occupancy";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import { runRemaining, walkRemaining, type MoveMode } from "@/lib/vtt/movement";

export type MovementPathContext = {
  tokens: BattleToken[];
  gridRadius: number;
  actorRacas?: Record<string, string | undefined>;
};

function canEnterFactory(
  occupancy: OccupancyMap,
  moverFootprint: ReturnType<typeof occupancyContext>["moverFootprint"],
  gridRadius: number
): (hex: Axial) => boolean {
  return (hex) => canEnterHex(hex, moverFootprint, occupancy, gridRadius);
}

export function movementPathTo(
  token: BattleToken,
  target: Axial,
  mode: MoveMode,
  ctx: MovementPathContext
): Axial[] | null {
  const maxSteps = mode === "walk" ? walkRemaining(token) : runRemaining(token);
  const { occupancy, moverFootprint } = occupancyContext(
    ctx.tokens,
    token,
    ctx.actorRacas
  );
  const canEnter = canEnterFactory(occupancy, moverFootprint, ctx.gridRadius);
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
  scene: Pick<BattleScene, "tokens" | "gridRadius">,
  actorRacas?: Record<string, string | undefined>
): Axial[] {
  const maxSteps = mode === "walk" ? walkRemaining(token) : runRemaining(token);
  const { occupancy, moverFootprint } = occupancyContext(
    scene.tokens,
    token,
    actorRacas
  );
  const canEnter = canEnterFactory(occupancy, moverFootprint, scene.gridRadius);
  return reachableHexesBfs(token.axial, maxSteps, canEnter);
}
