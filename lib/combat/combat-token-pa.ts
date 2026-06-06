import type { CharacterSheet } from "@/lib/character/types";
import {
  paMaxForActor,
  paTurnRulesForActor,
  paTurnRulesForMonster,
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
import { isMonsterToken } from "@/lib/room/settings";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

export function paMaxForCombatToken(room: RoomState, token: BattleToken): number {
  if (token.linked && token.actorId && room.actors[token.actorId]) {
    return paMaxForActor(room.actors[token.actorId]);
  }
  return token.paMax;
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
  if (turn?.bypassTurn) return true;
  if (turn?.activeTokenId && token.id === turn.activeTokenId) return true;
  if (!turn?.activeTokenId && opts?.combatHasOrder === false && isMonsterToken(token)) {
    return true;
  }
  return false;
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
    },
    { combatHasOrder: hasOrder }
  );
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
