import type { ChatMessage } from "@/lib/room/chat";

export type CombatChatRevealPhase = "roll" | "damage";

/** Mensagens de combate com animação de dado no mapa (exclui derrota e intro de área). */
export function isStagedCombatChatMessage(msg: ChatMessage): boolean {
  if (msg.kind !== "combat" || !msg.combat) return false;
  const c = msg.combat;
  if (c.resolution === "defeat") return false;
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
