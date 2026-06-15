import type { CharacterSheet } from "@/lib/character/types";
import {
  paMaxForActor,
  paTurnRulesForActor,
  paTurnRulesForMonster,
  PA_RECOVERY_PER_TURN,
} from "@/lib/combat/pa-economy";
import type { CombatTurnOptions } from "@/lib/combat/types";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import {
  materializeCombatPa,
  refreshPaAtTurnStart,
  startTurnPaFull,
  tokenPaSpentThisTurn,
  tokenSpendablePa,
} from "@/lib/combat/pa-turn";
import { canActOnCombatTurn } from "@/lib/combat/turn-guard";
import { tryOnKillPaBonus } from "@/lib/combat/pa-passive-effects";
import { applyCombatSpendablePaIfDue } from "@/lib/combat/turn-economy";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

export function paMaxForCombatToken(room: RoomState, token: BattleToken): number {
  if (token.linked && token.actorId && room.actors[token.actorId]) {
    return paMaxForActor(room.actors[token.actorId]);
  }
  return token.paMax ?? PA_RECOVERY_PER_TURN;
}

/** Pool + guardados prontos para validar/gastar PA em combate. */
export function prepareCombatToken(room: RoomState, token: BattleToken): BattleToken {
  const paMax = paMaxForCombatToken(room, token);
  const prepared = materializeCombatPa(token, paMax);
  return { ...token, ...normalizeTokenPaFields(prepared, paMax) };
}

function grantSpendablePaForCheck(
  token: BattleToken,
  actor: CharacterSheet | null,
  ctx: {
    combatActive?: boolean;
    combatHasOrder?: boolean;
    activeTokenId?: string | null;
    bypassTurn?: boolean;
  }
): BattleToken {
  if (ctx.combatActive === false) {
    return prepareCombatTokenFromParts(token, actor);
  }

  const rules = actor ? paTurnRulesForActor(actor) : paTurnRulesForMonster(token.monsterTier);
  const paMax = rules.recoveryPerTurn;
  let prepared = materializeCombatPa(token, paMax);
  prepared = { ...token, ...normalizeTokenPaFields(prepared, paMax) };

  if (tokenSpendablePa(prepared) > 0 || tokenPaSpentThisTurn(prepared) > 0) {
    return prepared;
  }

  const hasOrder = ctx.combatHasOrder ?? true;
  if (hasOrder) {
    if (
      !canActOnCombatTurn(token.id, {
        activeTokenId: ctx.activeTokenId,
        bypassTurn: ctx.bypassTurn,
        combatHasOrder: true,
        combatActive: ctx.combatActive,
      })
    ) {
      return prepared;
    }
    const refreshed = refreshPaAtTurnStart(prepared, rules);
    return { ...prepared, ...normalizeTokenPaFields(refreshed, paMax, rules.accumulationCap) };
  }

  const refreshed = startTurnPaFull(prepared, rules);
  return { ...prepared, ...normalizeTokenPaFields(refreshed, paMax, rules.accumulationCap) };
}

function prepareCombatTokenFromParts(token: BattleToken, actor: CharacterSheet | null): BattleToken {
  const rules = actor ? paTurnRulesForActor(actor) : paTurnRulesForMonster(token.monsterTier);
  const paMax = rules.recoveryPerTurn;
  const prepared = materializeCombatPa(token, paMax);
  return { ...token, ...normalizeTokenPaFields(prepared, paMax) };
}

/** Normaliza PA do atacante antes de validar ataque (UI + servidor). */
export function attackerForCombatCheck(
  attacker: BattleToken,
  actor: CharacterSheet | null,
  turn?: CombatTurnOptions,
  opts?: { combatHasOrder?: boolean; combatActive?: boolean }
): BattleToken {
  return grantSpendablePaForCheck(attacker, actor, {
    activeTokenId: turn?.activeTokenId,
    bypassTurn: turn?.bypassTurn,
    combatHasOrder: opts?.combatHasOrder ?? turn?.combatHasOrder,
    combatActive: opts?.combatActive ?? turn?.combatActive,
  });
}

/** Garante PA gastável no servidor antes de validar/debitar. */
export function ensureTokenCombatPa(
  room: RoomState,
  token: BattleToken,
  opts?: { bypassTurn?: boolean }
): BattleToken {
  const refreshed =
    applyCombatSpendablePaIfDue(room, token.id, opts) ??
    room.scene.tokens.find((t) => t.id === token.id) ??
    token;
  return prepareCombatToken(room, refreshed);
}

/** Carrasco e outros bônus de PA ao eliminar inimigo (Cap. 2.6). */
export function applyOnKillPaBonusInRoom(
  room: RoomState,
  attackerTokenId: string
): string | undefined {
  const idx = room.scene.tokens.findIndex((t) => t.id === attackerTokenId);
  if (idx < 0) return undefined;

  const token = room.scene.tokens[idx]!;
  const actor =
    token.linked && token.actorId ? room.actors[token.actorId] ?? null : null;
  const { token: next, notice } = tryOnKillPaBonus(token, actor);
  if (next === token) return undefined;

  const tokens = [...room.scene.tokens];
  tokens[idx] = next;
  room.scene = { ...room.scene, tokens };
  syncActorPaFromToken(room, next);
  return notice;
}

export function syncActorPaFromToken(room: RoomState, token: BattleToken): void {
  if (!token.linked || !token.actorId || !room.actors[token.actorId]) return;
  const a = room.actors[token.actorId];
  room.actors[token.actorId] = {
    ...a,
    resources: {
      ...a.resources,
      pontosAcao: {
        value: token.pa ?? 0,
        max: token.paMax ?? a.resources.pontosAcao.max,
      },
    },
    revision: a.revision + 1,
  };
}
