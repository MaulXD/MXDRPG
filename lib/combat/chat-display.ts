import type { ChatMessage } from "@/lib/room/chat";
import { combatHealAmount, isCombatHealEvent } from "@/lib/room/chat-events";
import {
  combatChatActionTags,
  combatChatHeroCaption,
  combatUsageKind,
} from "@/lib/combat/chat-labels";
import { isGmSavingThrowCombat, savingThrowHeadline } from "@/lib/combat/saving-throw-chat";

export { savingThrowHeadline, isGmSavingThrowCombat } from "@/lib/combat/saving-throw-chat";

export { combatChatActionTags } from "@/lib/combat/chat-labels";
export { combatChatBonusHealNote, combatChatTargetName } from "@/lib/combat/chat-labels";

export type CombatChatRevealPhase = "roll" | "damage";

/** Mensagens de combate com animação de dado no mapa (exclui derrota e intro de área). */
export function isStagedCombatChatMessage(msg: ChatMessage): boolean {
  if (msg.kind !== "combat" || !msg.combat) return false;
  const c = msg.combat;
  if (c.resolution === "defeat") return false;
  if (isCombatHealEvent(c) && c.attackTotal === 0 && c.attackNatural === 20) return false;
  if (isCombatHealEvent(c) && !c.attackNatural && c.attackTotal == null) return false;
  if (c.areaCenterQ != null && c.areaCenterR != null && c.areaBatchId && !c.attackNatural && !c.saveTotal) {
    return false;
  }
  return c.resolution === "attack" || c.resolution === "save";
}

export function splitCombatChatDetail(
  detail: string,
  resolution: "attack" | "save" | "defeat" | undefined
): { roll: string; damage: string | null } {
  const parts = detail.split(" · ").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return { roll: detail, damage: null };

  if (resolution === "save") {
    const dmgIdx = parts.findIndex((p) => p.startsWith("Dano "));
    if (dmgIdx < 0) return { roll: detail, damage: null };
    return {
      roll: parts.slice(0, dmgIdx).join(" · "),
      damage: parts.slice(dmgIdx).join(" · "),
    };
  }

  const healIdx = parts.findIndex((p) => p.startsWith("Cura "));
  if (healIdx >= 0) {
    return {
      roll: parts.slice(0, healIdx).join(" · "),
      damage: parts.slice(healIdx).join(" · "),
    };
  }
  const dmgIdx = parts.findIndex((p) => p.startsWith("Dano "));
  if (dmgIdx < 0) return { roll: detail, damage: null };
  return {
    roll: parts.slice(0, dmgIdx).join(" · "),
    damage: parts.slice(dmgIdx).join(" · "),
  };
}

/** Resumo sem bloco de dano (para fase do dado no chat). */
export function combatChatRollSummary(msg: ChatMessage): string {
  const c = msg.combat;
  if (!c) return msg.text;

  if (c.resolution === "save") {
    if (isGmSavingThrowCombat(c) && c.detail?.trim()) {
      return c.detail.trim();
    }
    const m = msg.text.match(
      /^(.+vs CD \d+\s*—\s*(?:resistiu \(metade\)|falhou \(dano pleno\)))/i
    );
    return m ? m[1] : msg.text;
  }

  if (c.criticalFail || c.hit === false) return msg.text;

  if (c.critical) {
    const m = msg.text.match(/^(.+?CRÍTICO[^!]*!)/);
    return m ? m[1] : msg.text.replace(/\s[\d.]+\s+[\wáàâãéêíóôõúç]+(\s*\([^)]*\))?$/i, "");
  }

  if (c.hit && c.attackTotal != null && c.defenderAc != null) {
    const m = msg.text.match(/^(.+:\s*\d+\s+vs\s+CA\s+\d+)/i);
    if (m) return m[1];
  }

  return msg.text;
}

export function combatChatDamageSummary(msg: ChatMessage): string {
  return msg.text;
}

export function combatChatNaturalDie(msg: ChatMessage): number | null {
  const c = msg.combat;
  if (!c) return null;
  if (c.attackNatural != null) return c.attackNatural;
  if (c.saveNatural != null) return c.saveNatural;
  return null;
}

export function shouldShowCombatDamageInChat(
  msg: ChatMessage,
  reveal: CombatChatRevealPhase | undefined
): boolean {
  if (!isStagedCombatChatMessage(msg)) return true;
  if (!reveal) return true;
  return reveal === "damage";
}

export function combatChatAuthorRoleLabel(role: ChatMessage["authorRole"]): string {
  if (role === "mestre") return "Mestre";
  if (role === "admin") return "Admin";
  if (role === "guest") return "Visitante";
  return "Jogador";
}

/** Fórmula legível para o bloco central do cartão (ex.: 1d20 + 2 + 3). */
export function combatChatRollFormula(detailRoll: string): string {
  const chunk = detailRoll.split(" · ")[0]?.trim() ?? detailRoll.trim();
  const attack = chunk.match(/1d20\s*=\s*(\d+)((?:\s*[+-]\d+)*)\s*=\s*(\d+)/i);
  if (attack) {
    const mods = attack[2].match(/[+-]\d+/g)?.join(" ") ?? "";
    return mods ? `1d20 ${mods}` : "1d20";
  }
  const save = chunk.match(/Teste\s+1d20\s*=\s*(\d+)((?:\s*[+-]\d+)*)\s*=\s*(\d+)/i);
  if (save) {
    const mods = save[2].match(/[+-]\d+/g)?.join(" ") ?? "";
    return mods ? `1d20 ${mods}` : "1d20";
  }
  return chunk.length > 48 ? `${chunk.slice(0, 45)}…` : chunk || "—";
}

export function combatChatHeroDisplay(
  msg: ChatMessage,
  showDamage: boolean
): { value: string; caption: string } {
  const c = msg.combat;
  if (!c) return { value: "—", caption: "" };

  if (c.resolution === "defeat") {
    return { value: "0", caption: "HP" };
  }

  if (!showDamage) {
    const natural = combatChatNaturalDie(msg);
    if (natural != null) {
      return {
        value: String(natural),
        caption: c.resolution === "save" ? "d20" : natural === 20 ? "Natural 20" : natural === 1 ? "Natural 1" : "d20",
      };
    }
    if (c.attackTotal != null) {
      return { value: String(c.attackTotal), caption: `vs CA ${c.defenderAc ?? "?"}` };
    }
    if (c.saveTotal != null) {
      return { value: String(c.saveTotal), caption: `vs CD ${c.saveDc ?? "?"}` };
    }
  }

  if (c.hit === false || c.criticalFail) {
    return { value: String(c.attackNatural ?? c.attackTotal ?? "—"), caption: "Errou" };
  }

  if (isCombatHealEvent(c)) {
    const heal = combatHealAmount(c);
    if (heal > 0) {
      return {
        value: `+${heal}`,
        caption: combatChatHeroCaption(c, msg.text) ?? "HP",
      };
    }
  }

  const usageKind = combatUsageKind(c, msg.text);
  if (usageKind === "buff" || usageKind === "consumable_effect") {
    return { value: "↑", caption: "Aplicado" };
  }
  if (usageKind === "debuff") {
    return { value: "↓", caption: "Efeito" };
  }

  if (c.damageTotal != null && c.damageTotal > 0) {
    const type = c.spellDamageType?.trim();
    return {
      value: String(c.damageTotal),
      caption: type ? `Dano ${type}` : "Dano",
    };
  }

  if (c.attackTotal != null) {
    return { value: String(c.attackTotal), caption: `vs CA ${c.defenderAc ?? "?"}` };
  }

  return { value: "—", caption: "" };
}
