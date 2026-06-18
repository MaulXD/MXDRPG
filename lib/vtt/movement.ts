import { effectiveMovementPaCost } from "@/lib/combat/pa-economy";
import { applyPaSpend, checkCanSpendPa } from "@/lib/combat/pa-turn";
import type { Axial } from "@/lib/vtt/grid-math";
import { axialDistance } from "@/lib/vtt/grid-math";
import { pathStepCount } from "@/lib/vtt/grid-path";
import { cellsToFeet, pathFeetCost } from "@/lib/vtt/movement-feet";
import {
  creatureSizeOf,
  isMultiCellCreatureSize,
  occupiedCells,
} from "@/lib/vtt/creature-size";
import {
  movementPathTo,
  reachableMovementDistances,
  type MovementPathContext,
} from "@/lib/vtt/movement-path";
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

/** Eldarin tactical grid: 1 célula = 1,5 m (9 m base ≈ 6 células) */
export const METERS_PER_CELL = 1.5;
export const BASE_MOVEMENT_METERS = 9;

export function cellsToMeters(cells: number): number {
  return Math.round(cells * METERS_PER_CELL * 10) / 10;
}

export function formatMovementLabel(spent: number, max: number): string {
  const left = Math.max(0, max - spent);
  return `${left}/${max} células (${cellsToFeet(left)}/${cellsToFeet(max)} ft)`;
}

export function movementSpent(token: BattleToken): number {
  return token.movementSpentCells ?? 0;
}

export function movementWalkMax(token: BattleToken): number {
  const v = token.movementWalkMax ?? token.walk;
  return Number.isFinite(v) && v >= 0 ? v : 4;
}

export function movementRunMax(token: BattleToken): number {
  const v = token.movementRunMax ?? token.run;
  return Number.isFinite(v) && v >= 0 ? v : 6;
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
  /** Mestre com bypass: move sem gastar nem exigir PA. */
  gmBypass?: boolean;
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
            ? "Mesma célula"
            : "Sem rota — célula bloqueada ou fora do alcance",
        dist: straight,
        paCost: 0,
        needsPa: false,
        nextSpent: spent,
        nextPa: token.pa,
      };
    }
    path = found;
    dist = pathStepCount(found);
    const feetLeft =
      mode === "walk" ? cellsToFeet(walkLeft) : cellsToFeet(runLeft);
    if (pathFeetCost(found) > feetLeft + 0.001) {
      return {
        ok: false,
        reason: `Fora do alcance (${pathFeetCost(found)} ft; restam ${feetLeft} ft)`,
        dist,
        paCost: 0,
        needsPa: false,
        nextSpent: spent,
        nextPa: token.pa,
        path,
      };
    }
  } else {
    dist = axialDistance(token.axial, target);
  }

  const rawPaCost = movementPaCost(spent, dist, bands);
  const paCost = paOpts?.gmBypass
    ? 0
    : effectiveMovementPaCost(token, rawPaCost, paOpts?.freeBasicMovePa);

  if (dist === 0) {
    return { ok: false, reason: "Mesma célula", dist, paCost: 0, needsPa: false, nextSpent: spent, nextPa: token.pa, path };
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
        reason: `Caminhada: faltam ${dist - walkLeft} células (${cellsToMeters(dist - walkLeft)} m) — use corrida`,
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
      reason: `Corrida: máx ${runLeft} células restantes`,
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
  return { ...token, movementSpentCells: 0 };
}

export function defaultMovementFields(token: Pick<BattleToken, "walk" | "run">): Pick<
  BattleToken,
  "movementSpentCells" | "movementWalkMax" | "movementRunMax"
> {
  return {
    movementSpentCells: 0,
    movementWalkMax: token.walk,
    movementRunMax: token.run,
  };
}

export function reachableCells(token: BattleToken, mode: MoveMode): number {
  return mode === "walk" ? walkRemaining(token) : runRemaining(token);
}

function expandAnchorKeysToFootprint(
  anchorKeys: Iterable<string>,
  size: ReturnType<typeof creatureSizeOf>
): Set<string> {
  if (!isMultiCellCreatureSize(size)) return new Set(anchorKeys);
  const set = new Set<string>();
  for (const key of anchorKeys) {
    const [q, r] = key.split(",").map(Number);
    for (const cell of occupiedCells({ q, r }, size)) {
      set.add(`${cell.q},${cell.r}`);
    }
  }
  return set;
}

/** Células cujo movimento exige PA (BFS + faixas, sem pathfind por célula). */
export function paidMovementCellKeys(
  token: BattleToken,
  mode: MoveMode,
  ctx: MovementPathContext,
  paOpts?: MovePaOptions,
  distMap?: Map<string, number>
): Set<string> {
  const spent = movementSpent(token);
  const walkLeft = walkRemaining(token);
  const runLeft = runRemaining(token);
  const bands = movementPaBandsForToken(token);
  const resolvedDist =
    distMap ??
    reachableMovementDistances(token, mode, ctx, ctx.actorRacas);
  const anchorKeys = new Set<string>();
  for (const [key, dist] of resolvedDist) {
    if (dist === 0) continue;
    if (mode === "walk" && dist > walkLeft) continue;
    if (mode === "run" && dist > runLeft) continue;
    const rawPaCost = movementPaCost(spent, dist, bands);
    const paCost = paOpts?.gmBypass
      ? 0
      : effectiveMovementPaCost(token, rawPaCost, paOpts?.freeBasicMovePa);
    if (paCost <= 0) continue;
    if (!paOpts?.gmBypass) {
      const paCheck = checkCanSpendPa(token, paCost);
      if (!paCheck.ok) continue;
    }
    anchorKeys.add(key);
  }
  const moverRaca = token.actorId ? ctx.actorRacas?.[token.actorId] : undefined;
  return expandAnchorKeysToFootprint(anchorKeys, creatureSizeOf(token, moverRaca));
}
