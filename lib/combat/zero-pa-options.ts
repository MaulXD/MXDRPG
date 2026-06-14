import { effectiveMovementPaCost } from "@/lib/combat/pa-economy";
import {
  paTurnRulesForActor,
  paTurnRulesForMonster,
  type PaTurnRules,
} from "@/lib/combat/pa-economy";
import type { RoomState } from "@/lib/room/types";
import { walkRemaining } from "@/lib/vtt/movement";
import { movementPaBandsForToken, movementPaCost } from "@/lib/vtt/movement-pa";
import type { BattleToken } from "@/lib/vtt/types";

function paRulesForToken(room: RoomState, token: BattleToken): PaTurnRules {
  if (token.linked && token.actorId && room.actors[token.actorId]) {
    return paTurnRulesForActor(room.actors[token.actorId]);
  }
  return paTurnRulesForMonster(token.monsterTier);
}

/** Ainda pode caminhar sem PA (faixa livre ou O Peão). */
export function tokenMayActWithZeroSpendablePa(
  room: RoomState,
  token: BattleToken
): boolean {
  if (walkRemaining(token) <= 0) return false;
  const spent = token.movementSpentHex ?? 0;
  const bands = movementPaBandsForToken(token);
  const rules = paRulesForToken(room, token);
  const rawCost = movementPaCost(spent, 1, bands);
  const effCost = effectiveMovementPaCost(token, rawCost, rules.freeBasicMovePa);
  return effCost === 0;
}
