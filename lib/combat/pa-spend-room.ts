import {
  phaseHasRealPaSpend,
  phaseHasTurnOrder,
  resolveCombatPaPhase,
} from "@/lib/combat/combat-pa-phase";
import { applyPaSpend, type PaSpendOptions } from "@/lib/combat/pa-turn";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

/** Em exploração, ações não debitam PA. */
export function spendPaForRoomAction(
  room: RoomState,
  token: BattleToken,
  cost: number,
  opts?: PaSpendOptions
): BattleToken {
  if (cost <= 0 || !phaseHasRealPaSpend(resolveCombatPaPhase(room.settings, room.combat))) {
    return token;
  }
  return applyPaSpend(token, cost, opts);
}
