import type { CharacterSheet } from "@/lib/character/types";
import type { MealQuality } from "@/lib/culinary/types";

/** Cap. 5.3 — qualidade pelo total do teste de Coccao. */
export function mealQualityFromCoccaoRoll(total: number): MealQuality {
  if (total <= 7) return "gororoba";
  if (total <= 15) return "comum";
  if (total <= 20) return "gourmet";
  return "perfeito";
}

/** Cap. 5.4 — escolhas extras além do Foco (d4: 1→0, 2→1, 3→2, 4→3). */
export function extraAssimilationPicksFromPlate(d4: number): number {
  const roll = Math.floor(d4);
  if (roll < 1 || roll > 4) return 0;
  return roll - 1;
}

export function maxAssimilationPicksFromPlate(d4: number): number {
  return 1 + extraAssimilationPicksFromPlate(d4);
}

/** Cap. 5.3 — cura de HP pela qualidade (sem rolagem de gororoba aqui). */
export function hpHealedByMealQuality(
  quality: MealQuality,
  actor: CharacterSheet,
  gororobaRoll?: number
): number {
  const missing = Math.max(0, actor.resources.vida.max - actor.resources.vida.value);
  switch (quality) {
    case "gororoba":
      return Math.max(1, gororobaRoll ?? 2);
    case "comum":
      return Math.ceil(missing * 0.5);
    case "gourmet":
    case "perfeito":
      return missing;
    default:
      return 0;
  }
}

/** Cap. 5.3 — restauração parcial de PA (Mana) após refeição comum+. */
export function paRestoredByMealQuality(
  quality: MealQuality,
  actor: CharacterSheet
): number {
  if (quality === "gororoba") return 0;
  const missing = Math.max(0, actor.resources.pontosAcao.max - actor.resources.pontosAcao.value);
  if (quality === "comum") return Math.ceil(missing * 0.5);
  return missing;
}

export function mealQualityLabel(quality: MealQuality): string {
  switch (quality) {
    case "gororoba":
      return "Gororoba";
    case "comum":
      return "Refeição comum";
    case "gourmet":
      return "Refeição gourmet";
    case "perfeito":
      return "Prato perfeito";
  }
}
