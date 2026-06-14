import type { ChatMessage } from "@/lib/room/chat";
import { isGmSavingThrowCombat } from "@/lib/combat/saving-throw-chat";
import { combatHealAmount, isCombatHealEvent } from "@/lib/room/chat-events";

export type CombatUsageKind =
  | "defeat"
  | "spell_save"
  | "weapon_attack"
  | "unarmed_attack"
  | "spell"
  | "consumable_heal"
  | "consumable_effect"
  | "heal_ally"
  | "heal_self"
  | "buff"
  | "debuff"
  | "ability"
  | "info";

const BUFF_HINTS = [
  "assume ",
  "prepara ",
  "inspira ",
  "canta sobre",
  "vantagem no próximo",
  "próximo ataque",
  "defesa até",
  "barreira",
  "fúria controlada",
  "furia controlada",
  "escudo",
  "postura",
  "teleporte",
  "transformação",
  "recupera pa",
];

const DEBUFF_HINTS = ["finta", "restring", "atordoa", "marca ", "desvantagem no próximo ataque"];

function blob(c: NonNullable<ChatMessage["combat"]>, text?: string): string {
  return `${c.weaponName ?? ""} ${c.detail ?? ""} ${text ?? ""}`.toLowerCase();
}

function isPotionLike(c: NonNullable<ChatMessage["combat"]>, text?: string): boolean {
  const b = blob(c, text);
  return b.includes("poção") || b.includes("pocao") || /\bbebe\b/.test(b);
}

function isConsumableUse(c: NonNullable<ChatMessage["combat"]>, text?: string): boolean {
  const b = blob(c, text);
  return (
    isPotionLike(c, text) ||
    (c.actionKind === "ability" &&
      c.attackerTokenId === c.defenderTokenId &&
      (b.includes("usa ") || b.includes("bebe ")) &&
      !c.attackTotal)
  );
}

export function combatUsageKind(
  c: NonNullable<ChatMessage["combat"]>,
  text?: string
): CombatUsageKind {
  if (c.resolution === "defeat") return "defeat";
  if (c.resolution === "save") return "spell_save";
  if (c.actionKind === "weapon") return "weapon_attack";
  if (c.actionKind === "unarmed") return "unarmed_attack";
  if (c.actionKind === "spell") {
    if (isCombatHealEvent(c)) {
      return c.attackerTokenId === c.defenderTokenId ? "heal_self" : "heal_ally";
    }
    return "spell";
  }

  const selfTarget = c.attackerTokenId === c.defenderTokenId;
  const b = blob(c, text);

  if (isCombatHealEvent(c)) {
    if (isConsumableUse(c, text)) return "consumable_heal";
    if (selfTarget) return "heal_self";
    return "heal_ally";
  }

  if (c.actionKind === "ability") {
    if (isConsumableUse(c, text)) return "consumable_effect";
    if (DEBUFF_HINTS.some((h) => b.includes(h))) return "debuff";
    if (BUFF_HINTS.some((h) => b.includes(h))) return "buff";
    if (!c.damageTotal && !c.attackTotal && c.hit == null) return "buff";
    return "ability";
  }

  return "info";
}

const USAGE_TAG_LABELS: Record<CombatUsageKind, string[]> = {
  defeat: ["Derrota"],
  spell_save: ["Magia", "Resistência"],
  weapon_attack: ["Ataque", "Arma"],
  unarmed_attack: ["Ataque", "Desarmado"],
  spell: ["Magia"],
  consumable_heal: ["Consumível", "Cura"],
  consumable_effect: ["Consumível", "Efeito"],
  heal_self: ["Cura", "Em si"],
  heal_ally: ["Cura", "Aliado"],
  buff: ["Habilidade", "Buff"],
  debuff: ["Habilidade", "Controle"],
  ability: ["Habilidade"],
  info: ["Ação"],
};

export function combatChatActionTags(
  c: NonNullable<ChatMessage["combat"]>,
  text?: string
): string {
  if (isGmSavingThrowCombat(c)) {
    const tags = ["Salvaguarda"];
    if (c.saveAttribute?.trim()) tags.push(c.saveAttribute.trim());
    const mode = c.saveRollMode;
    if (mode === "advantage") tags.push("Vantagem");
    if (mode === "disadvantage") tags.push("Desvantagem");
    return tags.join(" · ");
  }

  const kind = combatUsageKind(c, text);
  const tags = [...USAGE_TAG_LABELS[kind]];
  const mode = c.attackRollMode ?? c.saveRollMode;
  if (mode === "advantage") tags.push("Vantagem");
  if (mode === "disadvantage") tags.push("Desvantagem");
  if (c.critical) tags.push("Crítico");
  if (c.criticalFail) tags.push("Falha crítica");
  return tags.join(" · ");
}

export function combatChatTargetName(
  c: NonNullable<ChatMessage["combat"]>,
  defenderName: string | null | undefined,
  text?: string
): string | null {
  if (c.resolution === "defeat") return null;
  const kind = combatUsageKind(c, text);
  if (kind === "consumable_heal" || kind === "heal_self" || kind === "consumable_effect") {
    return null;
  }
  if (!defenderName || c.attackerTokenId === c.defenderTokenId) return null;
  return defenderName;
}

/** Texto curto abaixo do valor (ex.: roubo de vida após ataque). */
export function combatChatBonusHealNote(c: NonNullable<ChatMessage["combat"]>): string | null {
  if (!c.attackerHeal || c.attackerHeal <= 0) return null;
  if (!c.damageTotal || c.damageTotal <= 0) return null;
  return `+${c.attackerHeal} HP recuperados`;
}

export function combatChatHeroCaption(
  c: NonNullable<ChatMessage["combat"]>,
  text?: string
): string | null {
  const kind = combatUsageKind(c, text);
  switch (kind) {
    case "consumable_heal":
    case "heal_self":
    case "heal_ally":
      return "Cura";
    case "buff":
    case "consumable_effect":
      return "Buff";
    case "debuff":
      return "Efeito";
    default:
      return null;
  }
}
