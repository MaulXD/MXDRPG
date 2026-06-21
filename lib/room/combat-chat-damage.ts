import type { AttackResolution } from "@/lib/combat/attack";
import type { SaveSpellResolution } from "@/lib/combat/spell";
import type { CombatActionOption } from "@/lib/combat/types";

function normalizeFormula(formula: string | undefined | null): string | undefined {
  const f = formula?.trim();
  if (!f || f === "0") return undefined;
  return f;
}

export function damageFormulaFromAttackResult(result: AttackResolution): string | undefined {
  return normalizeFormula(result.damage?.formula);
}

export function damageFormulaFromSaveResult(result: SaveSpellResolution): string | undefined {
  return normalizeFormula(result.damage?.formula);
}

export function damageFormulaFromAction(
  action: Pick<CombatActionOption, "damageFormula">
): string | undefined {
  return normalizeFormula(action.damageFormula);
}
