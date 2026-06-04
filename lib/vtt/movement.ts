import { effectiveMovementPaCost } from "@/lib/combat/pa-economy";
import { applyPaSpend, checkCanSpendPa } from "@/lib/combat/pa-turn";
import type { Axial } from "@/lib/vtt/hex-math";
import { axialDistance } from "@/lib/vtt/hex-math";
import { pathStepCount } from "@/lib/vtt/hex-path";
import { movementPathTo, type MovementPathContext } from "@/lib/vtt/movement-path";
import type { BattleToken } from "@/lib/vtt/types";
import {
  describeMovementPaBands,
  movementPaBandsForToken,
  movementPaCost,
  MOVEMENT_PA_COST,
} from "@/lib/vtt/movement-pa";

export type { MovementPathContext } from "@/lib/vtt/movement-path";

export {
  MOVEMENT_PA_COST,
  movementPaBands,
  movementPaBandsForToken,
  movementPaCost,
  describeMovementPaBands,
} from "@/lib/vtt/movement-pa";

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
  paCost: number;
  /** Custo bruto antes de O Peão */
  rawPaCost?: number;
  needsPa: boolean;
  nextSpent: number;
  nextPa: number;
  /** Caminho pelo grid (origem → destino) quando há contexto de cena */
  path?: Axial[];
};

function applyMovementPaCost(
  token: BattleToken,
  paCost: number,
  rawPaCost?: number,
  freeBasicMovePa?: boolean
): BattleToken {
  let next = paCost > 0 ? applyPaSpend(token, paCost) : token;
  if (freeBasicMovePa && (rawPaCost ?? paCost) > paCost) {
    next = { ...next, peaoFreeMoveUsed: true };
  }
  return next;
}

export type MovePaOptions = {
  /** O Peão: isenta 1 PA do bloco básico de movimento (1×/turno). */
  freeBasicMovePa?: boolean;
};

export function canMoveToken(
  token: BattleToken,
  target: Axial,
  mode: MoveMode,
  ctx?: MovementPathContext,
  paOpts?: MovePaOptions
): MoveCheck {
  const spent = movementSpent(token);
  const walkMax = movementWalkMax(token);
  const runMax = movementRunMax(token);
  const walkLeft = walkMax - spent;
  const runLeft = runMax - spent;
  const bands = movementPaBandsForToken(token);

  let path: Axial[] | undefined;
  let dist: number;

  if (ctx) {
    const found = movementPathTo(token, target, mode, ctx);
    if (!found) {
      const straight = axialDistance(token.axial, target);
      return {
        ok: false,
        reason:
          straight === 0
            ? "Mesmo hex"
            : "Sem rota — hex bloqueado ou fora do alcance",
        dist: straight,
        paCost: 0,
        needsPa: false,
        nextSpent: spent,
        nextPa: token.pa,
      };
    }
    path = found;
    dist = pathStepCount(found);
  } else {
    dist = axialDistance(token.axial, target);
  }

  const rawPaCost = movementPaCost(spent, dist, bands);
  const paCost = effectiveMovementPaCost(token, rawPaCost, paOpts?.freeBasicMovePa);

  if (dist === 0) {
    return { ok: false, reason: "Mesmo hex", dist, paCost: 0, needsPa: false, nextSpent: spent, nextPa: token.pa, path };
  }

  if (paCost > 0) {
    const paCheck = checkCanSpendPa(token, paCost);
    if (!paCheck.ok) {
      return {
        ok: false,
        reason: paCheck.reason ?? `Movimento exige ${paCost} PA`,
        dist,
        paCost,
        needsPa: true,
        nextSpent: spent,
        nextPa: token.pa,
      };
    }
  }

  if (mode === "walk") {
    if (dist > walkLeft) {
      return {
        ok: false,
        reason: `Caminhada: faltam ${dist - walkLeft} hex (${hexToMeters(dist - walkLeft)} m) — use corrida`,
        dist,
        paCost,
        needsPa: paCost > 0,
        nextSpent: spent,
        nextPa: token.pa,
      };
    }
    const afterSpend = applyMovementPaCost(
      token,
      paCost,
      rawPaCost,
      paOpts?.freeBasicMovePa
    );
    return {
      ok: true,
      dist,
      paCost,
      rawPaCost,
      needsPa: paCost > 0,
      nextSpent: spent + dist,
      nextPa: afterSpend.pa,
      path,
    };
  }

  if (dist > runLeft) {
    return {
      ok: false,
      reason: `Corrida: máx ${runLeft} hex restantes`,
      dist,
      paCost,
      needsPa: paCost > 0,
      nextSpent: spent,
      nextPa: token.pa,
    };
  }

  const afterSpend = applyMovementPaCost(
    token,
    paCost,
    rawPaCost,
    paOpts?.freeBasicMovePa
  );
  return {
    ok: true,
    dist,
    paCost,
    rawPaCost,
    needsPa: paCost > 0,
    nextSpent: spent + dist,
    nextPa: afterSpend.pa,
    path,
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
