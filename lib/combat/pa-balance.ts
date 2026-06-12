import { PA_DEFAULT_ACTION_COST } from "@/lib/combat/pa-economy";
import type { CombatActionOption } from "@/lib/combat/types";

/** Ataque padrão (arma, magia de dano, habilidade ofensiva) — Cap. 3.1. */
export const PA_OFFENSIVE_ACTION_COST = PA_DEFAULT_ACTION_COST;

/** Truques, utilitários, cura leve nv1 — podem permanecer em 1 PA. */
export const PA_UTILITY_SPELL_COST = 1;

/** Magias de combate forte (nv 3+, área, burst, controle) — compêndio. */
export const PA_POWER_SPELL_COST = 3;

export type SpellPaTier = "cantrip" | "combat_nv1" | "combat_nv2" | "combat_nv3" | "combat_high";

/**
 * Exceções legadas — preferir `custoPontosAcao` em data/compendiums/magias.json.
 * Escala alvo: nv0/util = 1 PA · nv1–2 combate = 2 PA · nv3+ forte = 3 PA · recarga 1/turno em CC/cura/burst.
 */
export const SPELL_PA_OVERRIDES: Record<string, number> = {};

export function isMonsterOffensiveAction(action: CombatActionOption): boolean {
  if (action.selfTarget || action.allyTarget) return false;
  if (action.abilityEffect === "heal_touch" || action.abilityEffect === "ally_inspire") {
    return false;
  }
  if (action.kind === "ability") return false;
  if (action.resolution === "attack") return true;
  if (action.resolution === "save" && action.damageFormula && action.damageFormula !== "0") {
    return true;
  }
  return action.kind === "weapon" || action.kind === "unarmed";
}

/** Mantém custo do compêndio (mordidas 1 PA); só usa 2 PA se o JSON não definir custo. */
export function normalizeMonsterActionPa(action: CombatActionOption): CombatActionOption {
  if (!isMonsterOffensiveAction(action)) return action;
  const paCost = action.paCost > 0 ? action.paCost : PA_OFFENSIVE_ACTION_COST;
  if (paCost === action.paCost) return action;
  const label = action.label.replace(/PA\s+\d+/i, `PA ${paCost}`);
  return { ...action, paCost, label };
}

export function resolveSpellPaCost(entryId: string, raw: number): number {
  const override = SPELL_PA_OVERRIDES[entryId];
  if (override != null) return override;
  return Math.max(PA_UTILITY_SPELL_COST, raw);
}

export function formatActionPaLabel(label: string, paCost: number): string {
  if (/PA\s+\d+/i.test(label)) return label.replace(/PA\s+\d+/i, `PA ${paCost}`);
  return `${label} · PA ${paCost}`;
}
