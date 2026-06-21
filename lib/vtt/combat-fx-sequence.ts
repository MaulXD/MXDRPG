import { generalDamagePresetLabel } from "@/lib/combat/area-cascade";
import type { CombatFxState, CombatFxTargetBurst } from "@/lib/vtt/combat-fx-types";
import type { ChatMessage } from "@/lib/room/chat";
import { combatHealAmount, combatMessageLooksLikeHeal, isCombatHealEvent } from "@/lib/room/chat-events";
import type { Axial } from "@/lib/vtt/grid-math";
import type { BattleToken } from "@/lib/vtt/types";
import { resolveCastFxFromCombat } from "@/lib/vtt/token-cast-fx";

function axialFromCombat(c: NonNullable<ChatMessage["combat"]>): Axial | null {
  if (c.areaCenterQ == null || c.areaCenterR == null) return null;
  return { q: c.areaCenterQ, r: c.areaCenterR };
}

function areaCellsFromCombat(c: NonNullable<ChatMessage["combat"]>): Axial[] {
  if (!c.areaCellList?.length) {
    const center = axialFromCombat(c);
    return center ? [center] : [];
  }
  return c.areaCellList.map((h) => ({ q: h.q, r: h.r }));
}

export function isPlayableCombatFxMessage(msg: ChatMessage): boolean {
  if (msg.kind !== "combat" || !msg.combat) return false;
  const c = msg.combat;
  if (c.resolution === "defeat") return false;
  if (c.areaBatchId) return true;
  return c.resolution === "attack" || c.resolution === "save";
}

/** Feedback imediato enquanto POST /combat/attack responde. */
export function createPendingAttackFx(
  attacker: BattleToken,
  defender: BattleToken
): CombatFxState {
  return {
    id: `pending-${Date.now()}`,
    mode: "single",
    phase: "mark",
    markAxial: defender.axial,
    defenderAxial: defender.axial,
    attackerAxial: attacker.axial,
    attackerTokenId: attacker.id,
    defenderTokenId: defender.id,
    actionKind: "weapon",
    damageTotal: null,
    deferStateApply: true,
  };
}

export function isPendingCombatFx(fx: CombatFxState | null | undefined): boolean {
  return Boolean(fx?.id.startsWith("pending-"));
}

/** Última msg de combate 1:1 que bate com o pending (ataque ainda não visto). */
export function findPendingAttackMessage(
  chat: ChatMessage[],
  pending: CombatFxState,
  seen: Set<string>
): ChatMessage | null {
  for (let i = chat.length - 1; i >= 0; i--) {
    const msg = chat[i];
    if (!msg || msg.kind !== "combat" || !msg.combat || seen.has(msg.id)) continue;
    if (!isPlayableCombatFxMessage(msg)) continue;
    if (msg.combat.attackerTokenId !== pending.attackerTokenId) continue;
    if (msg.combat.defenderTokenId !== pending.defenderTokenId) continue;
    return msg;
  }
  return null;
}

/** Mescla resultado do servidor no FX pending — mantém id estável (não reinicia animação). */
export function resolvePendingCombatFx(
  pending: CombatFxState,
  msg: ChatMessage,
  tokens: BattleToken[]
): CombatFxState | null {
  if (!isPendingCombatFx(pending)) return null;
  const defender = tokens.find((t) => t.id === msg.combat?.defenderTokenId);
  const attacker = tokens.find((t) => t.id === msg.combat?.attackerTokenId);
  if (!defender || !attacker) return null;
  const resolved = combatFxFromMessage(msg, attacker.axial, defender.axial, {
    deferStateApply: pending.deferStateApply ?? true,
  });
  if (!resolved) return null;
  return {
    ...resolved,
    id: pending.id,
    chatMessageIds: resolved.chatMessageIds ?? [msg.id],
  };
}

function combatFxFromMessage(
  msg: ChatMessage,
  attackerAxial: Axial,
  defenderAxial: Axial,
  opts?: { deferStateApply?: boolean }
): CombatFxState | null {
  if (msg.kind !== "combat" || !msg.combat) return null;
  if (!isPlayableCombatFxMessage(msg)) return null;
  const c = msg.combat;
  const weaponName = c.weaponName ?? "";
  const detail = c.detail ?? "";
  const isHeal = isCombatHealEvent(c);
  const healAmount = isHeal ? combatHealAmount(c) : null;
  const castResolved = resolveCastFxFromCombat(msg);
  const castFxKind = castResolved?.kind ?? (isHeal ? "heal" : null);

  const base = {
    id: msg.id,
    mode: "single" as const,
    phase: "mark" as const,
    markAxial: defenderAxial,
    defenderAxial,
    attackerAxial,
    attackerTokenId: c.attackerTokenId,
    defenderTokenId: c.defenderTokenId,
    damageTotal: isHeal ? healAmount ?? c.damageTotal : c.damageTotal,
    isHeal,
    castFxKind,
    castFxTargetId: castResolved?.tokenId ?? c.defenderTokenId,
    deferStateApply: opts?.deferStateApply,
    resolveDetail: c.detail,
    spellDamageType: c.spellDamageType,
    damageFormula: c.damageFormula,
    damageTypeLabel: isHeal ? "Cura" : generalDamagePresetLabel(),
    chatMessageIds: [msg.id],
  };

  if (c.resolution === "save") {
    return {
      ...base,
      actionKind: "spell",
      ...(c.saveNatural != null ? { attackNatural: c.saveNatural } : {}),
      saveTotal: c.saveTotal,
      saveDc: c.saveDc,
      saveSuccess: c.saveSuccess,
    };
  }

  const actionKind: CombatFxState["actionKind"] =
    c.actionKind === "ability" ? "ability" : c.actionKind;

  return {
    ...base,
    actionKind,
    ...(c.attackNatural != null ? { attackNatural: c.attackNatural } : {}),
    ...(c.attackTotal != null ? { attackTotal: c.attackTotal } : {}),
    ...(c.defenderAc != null ? { defenderAc: c.defenderAc } : {}),
    ...(c.hit != null ? { hit: c.hit } : {}),
    ...(c.critical != null ? { critical: c.critical } : {}),
    ...(c.criticalFail != null ? { criticalFail: c.criticalFail } : {}),
  };
}

function buildAreaIntro(summary: ChatMessage, attackerAxial: Axial): CombatFxState | null {
  const c = summary.combat;
  if (!c || c.areaCenterQ == null || c.areaCenterR == null) return null;
  const center = { q: c.areaCenterQ, r: c.areaCenterR };
  const castResolved = resolveCastFxFromCombat(summary);
  const isHeal = combatMessageLooksLikeHeal(c);
  return {
    id: `${summary.id}-intro`,
    mode: "area-intro",
    phase: "mark",
    markAxial: center,
    defenderAxial: center,
    attackerAxial,
    actionKind: "spell",
    spellName: c.weaponName,
    resolveDetail: c.detail,
    damageTypeLabel: isHeal ? "Cura" : generalDamagePresetLabel(),
    spellDamageType: c.spellDamageType,
    areaCells: areaCellsFromCombat(c),
    areaCascade: c.areaCascade,
    damageTotal: c.damageTotal,
    isHeal,
    castFxKind: castResolved?.kind ?? (isHeal ? "heal" : "fire"),
    castFxTargetId: castResolved?.tokenId ?? c.defenderTokenId,
  };
}

function buildSimultaneousBurst(
  summary: ChatMessage,
  hits: ChatMessage[],
  tokens: BattleToken[],
  attackerAxial: Axial
): CombatFxState | null {
  const c = summary.combat;
  if (!c || c.areaCenterQ == null || c.areaCenterR == null) return null;
  const center = { q: c.areaCenterQ, r: c.areaCenterR };
  const targets: CombatFxTargetBurst[] = [];

  for (const msg of hits) {
    if (msg.kind !== "combat" || !msg.combat) continue;
    const hc = msg.combat;
    const token = tokens.find((t) => t.id === hc.defenderTokenId);
    if (!token) continue;
    const isHeal = isCombatHealEvent(hc);
    targets.push({
      tokenId: token.id,
      axial: token.axial,
      attackNatural: hc.attackNatural,
      attackTotal: hc.attackTotal,
      defenderAc: hc.defenderAc,
      saveTotal: hc.saveTotal,
      saveDc: hc.saveDc,
      saveSuccess: hc.saveSuccess,
      hit: hc.hit,
      critical: hc.critical,
      isHeal,
      damageTotal: isHeal ? combatHealAmount(hc) : hc.damageTotal,
      detail: hc.detail,
    });
  }

  const castResolved = resolveCastFxFromCombat(summary);
  const isAreaHeal = summary.combat ? combatMessageLooksLikeHeal(summary.combat) : false;

  return {
    id: `${summary.id}-simul`,
    mode: "area-simultaneous",
    phase: "mark",
    markAxial: center,
    defenderAxial: center,
    attackerAxial,
    actionKind: "spell",
    spellName: c.weaponName,
    resolveDetail: c.detail,
    damageTypeLabel: isAreaHeal ? "Cura" : generalDamagePresetLabel(),
    spellDamageType: c.spellDamageType,
    areaCells: areaCellsFromCombat(c),
    areaCascade: "simultaneous",
    areaTargets: targets,
    damageTotal: c.damageTotal,
    isHeal: isAreaHeal,
    castFxKind: castResolved?.kind ?? (isAreaHeal ? "heal" : "fire"),
    chatMessageIds: hits.map((m) => m.id),
  };
}

export function buildAreaFxSequence(
  summary: ChatMessage,
  hits: ChatMessage[],
  tokens: BattleToken[],
  attackerAxial: Axial,
  opts?: { deferStateApplyForToken?: (tokenId: string) => boolean }
): CombatFxState[] {
  const cascade = summary.combat?.areaCascade ?? "distance";
  const intro = buildAreaIntro(summary, attackerAxial);
  const out: CombatFxState[] = intro ? [intro] : [];

  if (hits.length === 0) return out;

  if (cascade === "simultaneous") {
    const burst = buildSimultaneousBurst(summary, hits, tokens, attackerAxial);
    if (burst) out.push(burst);
    return out;
  }

  for (let i = 0; i < hits.length; i++) {
    const msg = hits[i];
    const defender = tokens.find((t) => t.id === msg.combat?.defenderTokenId);
    if (!defender || msg.kind !== "combat" || !msg.combat) continue;
    const defer = opts?.deferStateApplyForToken?.(defender.id) ?? true;
    const fx = combatFxFromMessage(msg, attackerAxial, defender.axial, { deferStateApply: defer });
    if (!fx) continue;
    const isHeal = fx.isHeal ?? false;
    out.push({
      ...fx,
      id: msg.id,
      mode: "area-target",
      phase: "mark",
      markAxial: defender.axial,
      cascadeIndex: i + 1,
      cascadeTotal: hits.length,
      spellName: summary.combat?.weaponName,
      resolveDetail: msg.combat.detail,
      damageTypeLabel: isHeal ? "Cura" : generalDamagePresetLabel(),
      spellDamageType: summary.combat?.spellDamageType,
      areaCells: areaCellsFromCombat(summary.combat!),
      chatMessageIds: [msg.id],
    });
  }

  return out;
}

type BatchSlot = { summary: ChatMessage | null; hits: ChatMessage[]; ids: string[] };

export function ingestNewCombatFx(
  chat: ChatMessage[],
  seen: Set<string>,
  tokens: BattleToken[],
  opts?: { deferStateApplyForToken?: (tokenId: string) => boolean }
): { sequence: CombatFxState[]; markSeen: string[] } {
  const markSeen: string[] = [];
  const sequence: CombatFxState[] = [];

  const batches = new Map<string, BatchSlot>();
  const singles: ChatMessage[] = [];

  for (const msg of chat) {
    if (msg.kind !== "combat" || !msg.combat || seen.has(msg.id)) continue;
    if (msg.combat.resolution === "defeat") {
      markSeen.push(msg.id);
      continue;
    }
    const batchId = msg.combat.areaBatchId;
    if (batchId) {
      const slot = batches.get(batchId) ?? { summary: null, hits: [], ids: [] };
      slot.ids.push(msg.id);
      if (msg.combat.areaCenterQ != null && msg.combat.areaCenterR != null) {
        slot.summary = msg;
      } else {
        slot.hits.push(msg);
      }
      batches.set(batchId, slot);
      continue;
    }
    singles.push(msg);
  }

  for (const [, batch] of batches) {
    if (!batch.summary) continue;
    const attacker = tokens.find((t) => t.id === batch.summary!.combat!.attackerTokenId);
    if (!attacker) continue;
    const built = buildAreaFxSequence(batch.summary, batch.hits, tokens, attacker.axial, opts);
    if (!built.length) continue;
    sequence.push(...built);
    markSeen.push(...batch.ids);
  }

  for (const msg of singles) {
    if (seen.has(msg.id)) continue;
    if (!isPlayableCombatFxMessage(msg)) {
      markSeen.push(msg.id);
      continue;
    }
    const defender = tokens.find((t) => t.id === msg.combat!.defenderTokenId);
    const attacker = tokens.find((t) => t.id === msg.combat!.attackerTokenId);
    if (!defender || !attacker) continue;
    const defer = opts?.deferStateApplyForToken?.(defender.id) ?? true;
    const fx = combatFxFromMessage(msg, attacker.axial, defender.axial, { deferStateApply: defer });
    if (!fx) continue;
    sequence.push(fx);
    markSeen.push(msg.id);
  }

  return { sequence, markSeen };
}

export { combatFxFromMessage };

