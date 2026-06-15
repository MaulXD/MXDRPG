import { PA_ACCUMULATION_CAP_DEFAULT } from "@/lib/combat/pa-economy";
import { materializeCombatPa } from "@/lib/combat/pa-turn";
import { isMonsterToken } from "@/lib/room/settings";
import type { BattleToken } from "@/lib/vtt/types";

export type PaHudDisplay = {
  spendable: number;
  recovery: number;
  dotCapacity: number;
  filledDots: number;
};

/** PA estável para HUD — pool materializado, dots com capacidade fixa. */
export function resolvePaHudDisplay(
  token: BattleToken,
  accumulationCap = PA_ACCUMULATION_CAP_DEFAULT
): PaHudDisplay {
  const recovery = Math.max(0, token.paMax ?? 0);
  const materialized = materializeCombatPa(token, recovery);
  const spendable = Math.max(0, Math.round(materialized.pa ?? 0));
  const dotCapacity = isMonsterToken(token)
    ? Math.max(1, recovery || accumulationCap)
    : Math.max(1, accumulationCap);
  const filledDots = Math.min(dotCapacity, spendable);

  return { spendable, recovery, dotCapacity, filledDots };
}
