import type { Axial } from "@/lib/vtt/hex-math";
import { axialDistance } from "@/lib/vtt/hex-math";
import type { BattleToken } from "@/lib/vtt/types";

/** Eldarin tactical grid: 1 hex = 1,5 m (9 m base ≈ 6 hex) */
export const METERS_PER_HEX = 1.5;
export const BASE_MOVEMENT_METERS = 9;

export function hexToMeters(hex: number): number {
  return Math.round(hex * METERS_PER_HEX * 10) / 10;
}

export function formatMovementLabel(spent: number, max: number): string {
  const left = Math.max(0, max - spent);
  return `${left}/${max} hex (${hexToMeters(left)}/${hexToMeters(max)} m)`;
}

export function movementSpent(token: BattleToken): number {
  return token.movementSpentHex ?? 0;
}

export function movementWalkMax(token: BattleToken): number {
  return token.movementWalkMax ?? token.walk;
}

export function movementRunMax(token: BattleToken): number {
  return token.movementRunMax ?? token.run;
}

export function walkRemaining(token: BattleToken): number {
  return Math.max(0, movementWalkMax(token) - movementSpent(token));
}

export function runRemaining(token: BattleToken): number {
  return Math.max(0, movementRunMax(token) - movementSpent(token));
}

export type MoveMode = "walk" | "run";

export type MoveCheck = {
  ok: boolean;
  reason?: string;
  dist: number;
  needsPa: boolean;
  nextSpent: number;
  nextPa: number;
};

export function canMoveToken(
  token: BattleToken,
  target: Axial,
  mode: MoveMode
): MoveCheck {
  const dist = axialDistance(token.axial, target);
  const spent = movementSpent(token);
  const walkMax = movementWalkMax(token);
  const runMax = movementRunMax(token);
  const walkLeft = walkMax - spent;
  const runLeft = runMax - spent;

  if (dist === 0) {
    return { ok: false, reason: "Mesmo hex", dist, needsPa: false, nextSpent: spent, nextPa: token.pa };
  }

  if (mode === "walk") {
    if (dist > walkLeft) {
      return {
        ok: false,
        reason: `Caminhada: faltam ${dist - walkLeft} hex (${hexToMeters(dist - walkLeft)} m)`,
        dist,
        needsPa: false,
        nextSpent: spent,
        nextPa: token.pa,
      };
    }
    return { ok: true, dist, needsPa: false, nextSpent: spent + dist, nextPa: token.pa };
  }

  if (dist > runLeft) {
    return {
      ok: false,
      reason: `Corrida: máx ${runLeft} hex restantes`,
      dist,
      needsPa: false,
      nextSpent: spent,
      nextPa: token.pa,
    };
  }

  const needsPa = dist > walkLeft;
  if (needsPa && token.pa < 1) {
    return {
      ok: false,
      reason: "Corrida além da caminhada exige 1 PA",
      dist,
      needsPa: true,
      nextSpent: spent,
      nextPa: token.pa,
    };
  }

  return {
    ok: true,
    dist,
    needsPa,
    nextSpent: spent + dist,
    nextPa: needsPa ? token.pa - 1 : token.pa,
  };
}

export function resetTokenMovement(token: BattleToken): BattleToken {
  return { ...token, movementSpentHex: 0 };
}

export function defaultMovementFields(token: Pick<BattleToken, "walk" | "run">): Pick<
  BattleToken,
  "movementSpentHex" | "movementWalkMax" | "movementRunMax"
> {
  return {
    movementSpentHex: 0,
    movementWalkMax: token.walk,
    movementRunMax: token.run,
  };
}

export function reachableHexes(token: BattleToken, mode: MoveMode): number {
  return mode === "walk" ? walkRemaining(token) : runRemaining(token);
}
