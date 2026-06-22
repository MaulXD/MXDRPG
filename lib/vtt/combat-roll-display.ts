import type { CombatFxState } from "@/lib/vtt/combat-fx-types";

export type CombatRollVersus = {
  natural: number | null;
  modifier: number | null;
  total: number;
  difficultyLabel: "CA" | "CD";
  difficulty: number;
  /** Ex.: "Rolagem 13+1=14 VS CA 15" */
  formulaLine: string;
};

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function buildFormulaLine(
  natural: number | null,
  modifier: number | null,
  total: number,
  difficultyLabel: "CA" | "CD",
  difficulty: number
): string {
  const vs = `VS ${difficultyLabel} ${difficulty}`;
  if (natural != null && modifier != null && modifier !== 0) {
    return `Rolagem ${natural}${formatModifier(modifier)}=${total} ${vs}`;
  }
  if (natural != null && natural !== total) {
    return `Rolagem ${natural}=${total} ${vs}`;
  }
  if (natural != null) {
    return `Rolagem ${natural} ${vs}`;
  }
  return `${total} ${vs}`;
}

/** Monta natural/mod/total vs CA ou CD a partir do estado do FX de combate. */
export function buildCombatRollVersus(fx: CombatFxState): CombatRollVersus | null {
  if (fx.saveTotal != null && fx.saveDc != null) {
    const natural = fx.attackNatural ?? null;
    const total = fx.saveTotal;
    const modifier =
      natural != null && total !== natural ? total - natural : null;
    return {
      natural,
      modifier,
      total,
      difficultyLabel: "CD",
      difficulty: fx.saveDc,
      formulaLine: buildFormulaLine(natural, modifier, total, "CD", fx.saveDc),
    };
  }

  if (fx.attackTotal != null && fx.defenderAc != null) {
    const natural = fx.attackNatural ?? null;
    const total = fx.attackTotal;
    const modifier =
      natural != null && total !== natural ? total - natural : null;
    return {
      natural,
      modifier,
      total,
      difficultyLabel: "CA",
      difficulty: fx.defenderAc,
      formulaLine: buildFormulaLine(natural, modifier, total, "CA", fx.defenderAc),
    };
  }

  return null;
}
