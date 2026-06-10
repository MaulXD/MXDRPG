import type { CombatActionOption } from "@/lib/combat/types";
import { addTimedEffect } from "@/lib/combat/timed-effects";
import type { SaveRollBreakdown } from "@/lib/combat/spell";
import type { BattleToken } from "@/lib/vtt/types";

const WEAKENING_SPELLS = new Set(["magias-raios-de-enfraquecimento"]);

/** Patch no alvo após save falho — ex. Raios de Enfraquecimento. */
export function defenderPatchAfterSaveSpell(
  defender: BattleToken,
  action: CombatActionOption,
  save: SaveRollBreakdown,
  ctx: { round: number; activeIndex: number }
): Partial<BattleToken> | undefined {
  if (save.success) return undefined;
  if (!action.entryId || !WEAKENING_SPELLS.has(action.entryId)) return undefined;

  let next = addTimedEffect(defender, {
    kind: "debuff",
    label: "Enfraquecido",
    roundsLeft: 10,
    appliedRound: ctx.round,
    appliedActiveIndex: ctx.activeIndex,
    clearFields: ["weakened"],
  });
  next = { ...next, weakened: true };
  return {
    weakened: next.weakened,
    timedEffects: next.timedEffects,
  };
}
