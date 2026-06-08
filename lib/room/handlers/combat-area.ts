import { formatAttackChatDetail, resolveCombatAction } from "@/lib/combat/attack";
import { prepareCombatToken, syncActorPaFromToken } from "@/lib/combat/combat-token-pa";
import { applyPaSpend } from "@/lib/combat/pa-turn";
import { markActionRechargeUsed } from "@/lib/combat/recharge";
import {
  formatAreaSpellChatDetail,
  resolveAreaSpell,
  type AreaHit,
} from "@/lib/combat/area-spell";
import { resolveAreaCascadeMode, sortAreaHits } from "@/lib/combat/area-cascade";
import { createChatId } from "../chat";
import { formatSaveChatDetail } from "@/lib/combat/spell";
import type { CombatActionRequest } from "@/lib/combat/types";
import type { Axial } from "@/lib/vtt/hex-math";
import type { ChatMessage } from "../chat";
import { activeTokenId } from "../combat";
import { maybeRecordCombatUndo } from "../combat-undo";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import { syncCombatOrderWithTokens } from "../combat-order";
import { shouldAnnounceDefeat } from "../combat-chat-events";
import { recordMonsterDefeat } from "../combat-xp";
import { appendRoomChatMessage } from "./chat";
import type { AttackExecuteResult } from "./combat-attack";

export async function executeRoomAreaSpell(
  roomId: string,
  casterTokenId: string,
  center: Axial,
  author: { authorId: string; authorName: string; authorRole: ChatMessage["authorRole"] },
  opts: CombatActionRequest & { bypassTurn?: boolean } = {}
): Promise<AttackExecuteResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  let caster = room.scene.tokens.find((t) => t.id === casterTokenId);
  if (!caster) return { ok: false, error: "Token não encontrado" };

  caster = prepareCombatToken(room, caster);
  const cIdx = room.scene.tokens.findIndex((t) => t.id === casterTokenId);
  if (cIdx >= 0) {
    const tokens = [...room.scene.tokens];
    tokens[cIdx] = caster;
    room.scene = { ...room.scene, tokens };
    syncActorPaFromToken(room, caster);
  }
  if (!caster.linked || !caster.actorId) {
    return { ok: false, error: "Magia de área requer ficha linkada" };
  }

  const actor = room.actors[caster.actorId];
  if (!actor) return { ok: false, error: "Ficha não encontrada" };

  const action = resolveCombatAction(actor, opts);
  if (!action.areaShape || action.areaShape === "single") {
    return { ok: false, error: "Magia não é de área" };
  }

  const turn = {
    activeTokenId: activeTokenId(room.combat),
    bypassTurn: opts.bypassTurn,
    combatRound: room.combat.round,
    combatHasOrder: Boolean(room.combat?.order?.length),
  };

  const actorRacas: Record<string, string | undefined> = {};
  for (const [actorId, sheet] of Object.entries(room.actors)) {
    actorRacas[actorId] = sheet.identity?.raca;
  }

  let areaResult;
  try {
    areaResult = resolveAreaSpell(
      caster,
      center,
      actor,
      action,
      room.scene.tokens,
      room.actors,
      turn,
      opts.areaDirection,
      opts.channelExtraPa ?? 0,
      actorRacas
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Magia de área inválida" };
  }

  maybeRecordCombatUndo(room, {
    tokenId: casterTokenId,
    tokenName: caster.name,
    kind: "area",
    summary: action.label ?? action.name,
    bypassTurn: opts.bypassTurn,
  });

  const hpByToken = new Map<string, number>();
  for (const hit of areaResult.hits) {
    if (hit.kind === "attack") {
      hpByToken.set(hit.tokenId, hit.result.defenderHpAfter);
    } else if (hit.kind === "save") {
      hpByToken.set(hit.tokenId, hit.result.defenderHpAfter);
    }
  }

  const spentCaster = markActionRechargeUsed(
    applyPaSpend(caster, areaResult.paCost),
    action,
    room.combat.round
  );
  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      if (t.id === casterTokenId) return { ...t, ...spentCaster, id: t.id };
      const hp = hpByToken.get(t.id);
      if (hp != null) return { ...t, vida: hp };
      return t;
    }),
  };

  syncActorPaFromToken(room, { ...caster, ...spentCaster });

  for (const hit of areaResult.hits) {
    const target = room.scene.tokens.find((t) => t.id === hit.tokenId);
    if (!target?.linked || !target.actorId || !room.actors[target.actorId]) continue;
    const hpAfter =
      hit.kind === "attack"
        ? hit.result.defenderHpAfter
        : hit.kind === "save"
          ? hit.result.defenderHpAfter
          : null;
    if (hpAfter == null) continue;
    const d = room.actors[target.actorId];
    room.actors[target.actorId] = {
      ...d,
      resources: {
        ...d.resources,
        vida: { ...d.resources.vida, value: hpAfter },
      },
      revision: d.revision + 1,
    };
  }

  const areaBatchId = createChatId();
  const areaCascade = resolveAreaCascadeMode(action);
  const sortedHits: AreaHit[] = sortAreaHits(
    areaResult.hits,
    room.scene.tokens,
    areaResult.center,
    caster,
    areaCascade,
    room.combat.order
  );

  appendRoomChatMessage(room, {
    ...author,
    kind: "combat",
    text: areaResult.summary,
    combat: {
      attackerTokenId: caster.id,
      defenderTokenId: sortedHits[0]?.tokenId ?? caster.id,
      actionKind: "spell",
      weaponName: areaResult.actionName,
      resolution: action.resolution,
      areaCenterQ: areaResult.center.q,
      areaCenterR: areaResult.center.r,
      areaHexCount: areaResult.areaHexes.length,
      areaBatchId,
      areaShape: action.areaShape,
      areaCascade,
      areaHexList: areaResult.areaHexes,
      spellDamageType: action.damageType,
      damageTotal: sortedHits.reduce((sum, h) => {
        if (h.kind === "attack") return sum + (h.result.damage?.total ?? 0);
        if (h.kind === "save") return sum + h.result.damage.total;
        return sum;
      }, 0),
      defenderHpBefore: 0,
      defenderHpAfter: 0,
      detail: formatAreaSpellChatDetail(areaResult, action.damageType),
    },
  });

  for (const hit of sortedHits) {
    if (hit.kind === "save") {
      const r = hit.result;
      appendRoomChatMessage(room, {
        ...author,
        kind: "combat",
        text: r.summary,
        combat: {
          attackerTokenId: r.attackerTokenId,
          defenderTokenId: r.defenderTokenId,
          actionKind: "spell",
          weaponName: r.weaponName,
          areaBatchId,
          spellDamageType: action.damageType,
          resolution: "save",
          saveNatural: r.save.natural,
          saveTotal: r.save.total,
          saveDc: r.save.dc,
          saveSuccess: r.save.success,
          saveAttribute: r.save.attributeLabel,
          saveRollMode: r.save.rollMode,
          damageTotal: r.damage.total,
          defenderHpBefore: r.defenderHpBefore,
          defenderHpAfter: r.defenderHpAfter,
          detail: formatSaveChatDetail(r),
        },
      });
    } else if (hit.kind === "attack") {
      const r = hit.result;
      appendRoomChatMessage(room, {
        ...author,
        kind: "combat",
        text: r.summary,
        combat: {
          attackerTokenId: r.attackerTokenId,
          defenderTokenId: r.defenderTokenId,
          actionKind: "spell",
          weaponName: r.weaponName,
          areaBatchId,
          spellDamageType: action.damageType,
          resolution: "attack",
          attackNatural: r.attack.natural,
          attackTotal: r.attack.total,
          attackRollMode: r.attack.rollMode,
          defenderAc: r.defenderAc,
          hit: r.hit,
          critical: r.critical,
          criticalFail: r.criticalFail,
          damageTotal: r.damage?.total ?? null,
          defenderHpBefore: r.defenderHpBefore,
          defenderHpAfter: r.defenderHpAfter,
          detail: formatAttackChatDetail(r),
        },
      });
    }
  }

  const defeated = new Set<string>();
  for (const hit of sortedHits) {
    const r = hit.kind === "attack" ? hit.result : hit.kind === "save" ? hit.result : null;
    if (!r || defeated.has(hit.tokenId)) continue;
    if (!shouldAnnounceDefeat(r.defenderHpBefore, r.defenderHpAfter)) continue;
    defeated.add(hit.tokenId);
    const target = room.scene.tokens.find((t) => t.id === hit.tokenId);
    if (!target) continue;
    await recordMonsterDefeat(room, author, {
      defenderTokenId: hit.tokenId,
      defenderName: target.name,
      attackerTokenId: caster.id,
      hpBefore: r.defenderHpBefore,
    });
  }

  syncCombatOrderWithTokens(room);
  return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
}
