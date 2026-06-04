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

export function combatEventTone(combat: NonNullable<ChatMessage["combat"]>): CombatEventTone {
  if (combat.resolution === "defeat") return "defeat";
  if (combat.resolution === "save") return "save";
  if (combat.critical) return "crit";
  if (combat.criticalFail) return "crit-fail";
  if (combat.hit === false) return "miss";
  if (combat.hit) return "hit";
  if (combat.attackerHeal && combat.attackerHeal > 0) return "heal";
  return "info";
}

export function combatEventIcon(tone: CombatEventTone): string {
  switch (tone) {
    case "defeat":
      return "☠";
    case "crit":
      return "✦";
    case "crit-fail":
      return "✗";
    case "hit":
      return "⚔";
    case "miss":
      return "◇";
    case "save":
      return "🛡";
    case "heal":
      return "♥";
    default:
      return "•";
  }
}

export function parsePrimaryDie(formula: string): number {
  const m = formula.trim().match(/d(\d+)/i);
  if (m) return Math.min(100, Math.max(2, parseInt(m[1], 10)));
  return 20;
}
