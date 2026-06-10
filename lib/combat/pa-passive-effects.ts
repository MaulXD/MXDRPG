import { ON_KILL_PA } from "@/lib/character/pa-modifiers";
import type { CharacterSheet } from "@/lib/character/types";
import { grantPaBonus } from "@/lib/combat/pa-turn";
import type { BattleToken } from "@/lib/vtt/types";

function hasTalent(sheet: CharacterSheet, talentId: string): boolean {
  return (sheet.identity.talentos ?? []).some((t) => t.id === talentId);
}

function hasIncompatibleTalent(sheet: CharacterSheet, ids?: string[]): boolean {
  if (!ids?.length) return false;
  return ids.some((id) => hasTalent(sheet, id));
}

/** Carrasco (Cap. 2.6): +2 PA ao eliminar inimigo, 1×/turno; incompatível com O Peão. */
export function tryOnKillPaBonus(
  token: BattleToken,
  actor: CharacterSheet | null
): { token: BattleToken; notice?: string } {
  if (!actor) return { token };

  for (const [talentId, rule] of Object.entries(ON_KILL_PA)) {
    if (!hasTalent(actor, talentId)) continue;
    if (hasIncompatibleTalent(actor, rule.incompatibleWith)) continue;
    if (token.onKillPaGranted?.[talentId]) continue;

    const next = grantPaBonus(
      {
        ...token,
        onKillPaGranted: { ...token.onKillPaGranted, [talentId]: true },
      },
      rule.amount
    );

    const label = talentId === "carrasco" ? "Carrasco" : talentId.replace(/-/g, " ");
    return {
      token: next,
      notice: `${actor.name}: ${label} +${rule.amount} PA`,
    };
  }

  return { token };
}
