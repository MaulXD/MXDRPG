import type { ChatMessage } from "./chat";

export type CombatEventTone =
  | "defeat"
  | "crit"
  | "crit-fail"
  | "hit"
  | "miss"
  | "save"
  | "heal"
  | "info";

/** Cura pura (poção, magia de cura) — sem dano ao alvo. */
export function isCombatHealEvent(combat: NonNullable<ChatMessage["combat"]>): boolean {
  if (combat.damageTotal != null && combat.damageTotal > 0) return false;
  if (combat.attackerHeal != null && combat.attackerHeal > 0) return true;
  if (combat.defenderHpAfter > combat.defenderHpBefore) return true;
  return false;
}

export function combatHealAmount(combat: NonNullable<ChatMessage["combat"]>): number {
  if (combat.attackerHeal != null && combat.attackerHeal > 0) return combat.attackerHeal;
  return Math.max(0, combat.defenderHpAfter - combat.defenderHpBefore);
}

export function combatEventTone(combat: NonNullable<ChatMessage["combat"]>): CombatEventTone {
  if (combat.resolution === "defeat") return "defeat";
  if (combat.resolution === "save") return "save";
  if (combat.critical) return "crit";
  if (combat.criticalFail) return "crit-fail";
  if (combat.hit === false) return "miss";
  if (isCombatHealEvent(combat)) return "heal";
  if (combat.hit) return "hit";
  return "info";
}

export function parsePrimaryDie(formula: string): number {
  const m = formula.trim().match(/d(\d+)/i);
  if (m) return Math.min(100, Math.max(2, parseInt(m[1], 10)));
  return 20;
}
