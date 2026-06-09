import type { CharacterSheet } from "@/lib/character/types";
import {
  paMaxForActor,
  paTurnRulesForActor,
  paTurnRulesForMonster,
  PA_RECOVERY_PER_TURN,
  type PaTurnRules,
} from "@/lib/combat/pa-economy";
import type { CombatTurnOptions } from "@/lib/combat/types";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import {
  materializeCombatPa,
  startTurnPaFull,
  tokenSpendablePa,
} from "@/lib/combat/pa-turn";
import { activeTokenId } from "@/lib/room/combat";
import { canActOnCombatTurn } from "@/lib/combat/turn-guard";
import { isMonsterToken } from "@/lib/room/settings";
import { tryOnKillPaBonus } from "@/lib/combat/pa-passive-effects";
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

export function paTurnRulesForBattleToken(
  token: BattleToken,
  actor?: CharacterSheet | null
): PaTurnRules {
  if (actor) return paTurnRulesForActor(actor);
  return paTurnRulesForMonster(token.monsterTier);
}

function mayRefreshCombatPa(
  token: BattleToken,
  turn?: CombatTurnOptions,
  opts?: { combatHasOrder?: boolean }
): boolean {
  const combatHasOrder = opts?.combatHasOrder ?? turn?.combatHasOrder;
  if (!combatHasOrder) {
    return isMonsterToken(token);
  }
  return canActOnCombatTurn(token.id, {
    activeTokenId: turn?.activeTokenId,
    bypassTurn: turn?.bypassTurn,
    combatHasOrder: true,
  });
}

/** Normaliza PA do atacante antes de validar ataque (UI + servidor). */
export function attackerForCombatCheck(
  attacker: BattleToken,
  actor: CharacterSheet | null,
  turn?: CombatTurnOptions,
  opts?: { combatHasOrder?: boolean }
): BattleToken {
  const rules = paTurnRulesForBattleToken(attacker, actor);
  const paMax = rules.recoveryPerTurn;
  let prepared = materializeCombatPa(attacker, paMax);
  prepared = { ...attacker, ...normalizeTokenPaFields(prepared, paMax) };

  if (!mayRefreshCombatPa(prepared, turn, opts)) return prepared;
  if (tokenSpendablePa(prepared) > 0) return prepared;
  if ((prepared.paSpentThisTurn ?? 0) > 0) return prepared;

  const refreshed = startTurnPaFull(prepared, rules);
  return { ...prepared, ...normalizeTokenPaFields(refreshed, paMax) };
}

/** Garante PA do atacante no servidor (turno ativo, bypass do mestre ou monstro sem iniciativa). */
export function ensureTokenCombatPa(
  room: RoomState,
  token: BattleToken,
  opts?: { bypassTurn?: boolean }
): BattleToken {
  const prepared = prepareCombatToken(room, token);
  const actor =
    prepared.linked && prepared.actorId ? room.actors[prepared.actorId] ?? null : null;
  const hasOrder = Boolean(room.combat?.order?.length);
  return attackerForCombatCheck(
    prepared,
    actor,
    {
      activeTokenId: activeTokenId(room.combat),
      bypassTurn: opts?.bypassTurn,
      combatHasOrder: hasOrder,
    },
    { combatHasOrder: hasOrder }
  );
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
        value: token.pa,
        max: token.paMax,
      },
    },
    revision: a.revision + 1,
  };
}
