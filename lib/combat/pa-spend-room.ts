import {
  phaseHasRealPaSpend,
  resolveCombatPaPhase,
} from "@/lib/combat/combat-pa-phase";
import { applyPaSpend, type PaSpendOptions } from "@/lib/combat/pa-turn";
import { logPaSpend } from "@/lib/room/combat-log";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

/** Em exploração, ações não debitam PA. */
export function spendPaForRoomAction(
  room: RoomState,
  token: BattleToken,
  cost: number,
  opts?: PaSpendOptions & { summary?: string }
): BattleToken {
  if (cost <= 0 || !phaseHasRealPaSpend(resolveCombatPaPhase(room.settings, room.combat))) {
    return token;
  }
  const after = applyPaSpend(token, cost, opts);
  logPaSpend(room, token, after, cost, {
    summary: opts?.summary,
    actionKind: opts?.actionKind,
  });
  return after;
}
