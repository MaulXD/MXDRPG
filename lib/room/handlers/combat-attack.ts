import {
  attackerAfterAttack,
  buildAttackModifiers,
  canAttackTarget,
  formatAttackChatDetail,
  resolveRoomAttackAction,
  resolveTokenAttack,
} from "@/lib/combat/attack";
import { defenderPatchAfterSaveSpell } from "@/lib/combat/spell-debuffs";
import { formatSaveChatDetail, resolveSaveSpell, type SaveSpellResolution } from "@/lib/combat/spell";
import { spellTargetCount } from "@/lib/combat/spell-target-count";
import type { AttackResolution } from "@/lib/combat/attack";
import { patchTokenVitals } from "@/lib/vtt/token-hp-display";
import type { BattleToken } from "@/lib/vtt/types";
import { ensureTokenCombatPa, syncActorPaFromToken } from "@/lib/combat/combat-token-pa";
import { applyPaSpend } from "@/lib/combat/pa-turn";
import { markActionRechargeUsed } from "@/lib/combat/recharge";
import type { CombatActionRequest } from "@/lib/combat/types";
import type { ChatMessage } from "../chat";
import { activeTokenId } from "../combat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot } from "../types";
import { syncCombatOrderWithTokens } from "../combat-order";
import { shouldAnnounceDefeat } from "../combat-chat-events";
import { recordMonsterDefeat } from "../combat-xp";
import { maybeRecordCombatUndo } from "../combat-undo";
import { isMonsterToken } from "@/lib/room/settings";
import { appendRoomChatMessage } from "./chat";
import { executeRoomAbility } from "./combat-ability";
import { executeRoomSpellUtility, isSpellUtilityAction } from "./combat-spell-utility";

export type AttackExecuteResult =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

export async function executeRoomAttack(
  roomId: string,
  attackerTokenId: string,
  defenderTokenId: string,
  author: { authorId: string; authorName: string; authorRole: ChatMessage["authorRole"] },
  opts: CombatActionRequest & { bypassTurn?: boolean } = {}
): Promise<AttackExecuteResult> {
  const multiIds = opts.defenderTokenIds?.map((id) => id.trim()).filter(Boolean);
  if (multiIds && multiIds.length > 0) {
    return executeRoomMultiTargetAttack(roomId, attackerTokenId, multiIds, author, opts);
  }

  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  let attacker = room.scene.tokens.find((t) => t.id === attackerTokenId);
  const defender = room.scene.tokens.find((t) => t.id === defenderTokenId);
  if (!attacker || !defender) return { ok: false, error: "Token não encontrado" };

  attacker = ensureTokenCombatPa(room, attacker, { bypassTurn: opts.bypassTurn });
  const atkIdx = room.scene.tokens.findIndex((t) => t.id === attackerTokenId);
  if (atkIdx >= 0) {
    const tokens = [...room.scene.tokens];
    tokens[atkIdx] = attacker;
    room.scene = { ...room.scene, tokens };
    syncActorPaFromToken(room, attacker);
  }

  if (!attacker.linked || !attacker.actorId) {
    if (!isMonsterToken(attacker)) {
      return { ok: false, error: "Atacante sem ficha ou monstro" };
    }
  }

  const actor =
    attacker.linked && attacker.actorId ? room.actors[attacker.actorId] ?? null : null;
  if (attacker.linked && attacker.actorId && !actor) {
    return { ok: false, error: "Ficha do atacante não encontrada" };
  }

  const action = resolveRoomAttackAction(attacker, actor, opts);

  if (action.kind === "ability") {
    return executeRoomAbility(roomId, attackerTokenId, defenderTokenId, author, opts);
  }

  if (isSpellUtilityAction(action)) {
    return executeRoomSpellUtility(roomId, attackerTokenId, defenderTokenId, author, opts);
  }

  if (action.areaShape && action.areaShape !== "single") {
    return { ok: false, error: "Magia de área deve ser conjurada no mapa (centro da área)" };
  }

  const turn = {
    activeTokenId: activeTokenId(room.combat),
    bypassTurn: opts.bypassTurn,
    combatRound: room.combat.round,
    combatHasOrder: Boolean(room.combat?.order?.length),
  };

  const defenderActor =
    defender.linked && defender.actorId ? room.actors[defender.actorId] ?? null : null;

  if (action.resolution === "save" && actor) {
    let saveResult;
    try {
      saveResult = resolveSaveSpell(attacker, defender, actor, defenderActor, action, turn, {
        channelExtraPa: opts.channelExtraPa,
      });
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Magia inválida" };
    }

    maybeRecordCombatUndo(room, {
      tokenId: attackerTokenId,
      tokenName: attacker.name,
      kind: "attack",
      summary: action.label ?? action.name,
      bypassTurn: opts.bypassTurn,
    });

    const spentAttacker = markActionRechargeUsed(
      applyPaSpend(attacker, saveResult.paCost),
      action,
      room.combat.round
    );
    const debuffPatch = defenderPatchAfterSaveSpell(defender, action, saveResult.save, {
      round: room.combat.round,
      activeIndex: room.combat.activeIndex,
    });

    room.scene = {
      ...room.scene,
      tokens: room.scene.tokens.map((t) => {
        if (t.id === attackerTokenId) return { ...t, ...spentAttacker, id: t.id };
        if (t.id === defenderTokenId) {
          return {
            ...patchTokenVitals(t, { vida: saveResult.defenderHpAfter }),
            ...(debuffPatch ?? {}),
            id: t.id,
          };
        }
        return t;
      }),
    };

    syncActorPaFromToken(room, { ...attacker, ...spentAttacker });

    if (defender.linked && defender.actorId && room.actors[defender.actorId]) {
      const d = room.actors[defender.actorId];
      room.actors[defender.actorId] = {
        ...d,
        resources: {
          ...d.resources,
          vida: { ...d.resources.vida, value: saveResult.defenderHpAfter },
        },
        revision: d.revision + 1,
      };
    }

    appendRoomChatMessage(room, {
      ...author,
      kind: "combat",
      text: saveResult.summary,
      combat: {
        attackerTokenId: saveResult.attackerTokenId,
        defenderTokenId: saveResult.defenderTokenId,
        actionKind: "spell",
        weaponName: saveResult.weaponName,
        resolution: "save",
        saveNatural: saveResult.save.natural,
        saveTotal: saveResult.save.total,
        saveDc: saveResult.save.dc,
        saveSuccess: saveResult.save.success,
        saveAttribute: saveResult.save.attributeLabel,
        saveRollMode: saveResult.save.rollMode,
        damageTotal: saveResult.damage.total,
        defenderHpBefore: saveResult.defenderHpBefore,
        defenderHpAfter: saveResult.defenderHpAfter,
        detail: formatSaveChatDetail(saveResult),
      },
    });

    if (shouldAnnounceDefeat(saveResult.defenderHpBefore, saveResult.defenderHpAfter)) {
      await recordMonsterDefeat(room, author, {
        defenderTokenId,
        defenderName: defender.name,
        attackerTokenId,
        hpBefore: saveResult.defenderHpBefore,
      });
    }

    syncCombatOrderWithTokens(room);
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  }

  let results;
  try {
    results = resolveTokenAttack(attacker, defender, action, actor, turn, undefined, room.scene.tokens, {
      channelExtraPa: opts.channelExtraPa,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ataque inválido" };
  }

  maybeRecordCombatUndo(room, {
    tokenId: attackerTokenId,
    tokenName: attacker.name,
    kind: "attack",
    summary: action.label,
    bypassTurn: opts.bypassTurn,
  });

  const attackResults = Array.isArray(results) ? results : [results];
  const paCost = attackResults.reduce((sum, r) => sum + r.paCost, 0);
  const last = attackResults[attackResults.length - 1];
  const finalHp = last.defenderHpAfter;
  const finalAttackerHp =
    last.attackerHpAfter ?? attacker.vida ?? null;
  const spentAttacker = markActionRechargeUsed(applyPaSpend(attacker, paCost), action, room.combat.round);
  const built = buildAttackModifiers(attacker, defender, action);
  const anyHit = attackResults.some((r) => r.hit);
  const buffCleanup = attackerAfterAttack(
    attacker,
    action,
    built.consumeAttackerMark,
    built.consumeDefenderFinta,
    anyHit
  );

  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      if (t.id === attackerTokenId) {
        const patch: typeof t = { ...t, ...spentAttacker, ...buffCleanup, id: t.id };
        if (finalAttackerHp != null && t.vidaMax != null) patch.vida = finalAttackerHp;
        return patch;
      }
      if (t.id === defenderTokenId) {
        const tempAfter = last.defenderTempHpAfter;
        return patchTokenVitals(t, {
          vida: finalHp,
          vidaTemp: tempAfter != null && tempAfter > 0 ? tempAfter : undefined,
        });
      }
      return t;
    }),
  };

  syncActorPaFromToken(room, { ...attacker, ...spentAttacker });

  if (attacker.actorId && room.actors[attacker.actorId] && finalAttackerHp != null) {
    const a = room.actors[attacker.actorId];
    room.actors[attacker.actorId] = {
      ...a,
      resources: {
        ...a.resources,
        vida: { ...a.resources.vida, value: finalAttackerHp },
      },
      revision: a.revision + 1,
    };
  }

  if (defender.linked && defender.actorId && room.actors[defender.actorId]) {
    const d = room.actors[defender.actorId];
    room.actors[defender.actorId] = {
      ...d,
      resources: {
        ...d.resources,
        vida: {
          ...d.resources.vida,
          value: finalHp,
          temp:
            last.defenderTempHpAfter != null && last.defenderTempHpAfter > 0
              ? last.defenderTempHpAfter
              : undefined,
        },
      },
      revision: d.revision + 1,
    };
  }

  for (const result of attackResults) {
    appendRoomChatMessage(room, {
      ...author,
      kind: "combat",
      text: result.summary,
      combat: {
        attackerTokenId: result.attackerTokenId,
        defenderTokenId: result.defenderTokenId,
        actionKind: result.actionKind,
        weaponName: result.weaponName,
        resolution: "attack",
        attackNatural: result.attack.natural,
        attackTotal: result.attack.total,
        attackRollMode: result.attack.rollMode,
        defenderAc: result.defenderAc,
        hit: result.hit,
        critical: result.critical,
        criticalFail: result.criticalFail,
        damageTotal: result.damage?.total ?? null,
        defenderHpBefore: result.defenderHpBefore,
        defenderHpAfter: result.defenderHpAfter,
        attackerHpBefore: result.attackerHpBefore,
        attackerHpAfter: result.attackerHpAfter,
        attackerHeal: result.attackerHeal,
        detail: formatAttackChatDetail(result),
        attackIndex: result.attackIndex,
        attackCount: result.attackCount,
        ...(result.actionKind === "spell" ? { spellDamageType: action.damageType } : {}),
      },
    });
  }

  if (shouldAnnounceDefeat(last.defenderHpBefore, finalHp)) {
    await recordMonsterDefeat(room, author, {
      defenderTokenId,
      defenderName: defender.name,
      attackerTokenId,
      hpBefore: last.defenderHpBefore,
    });
  }

  syncCombatOrderWithTokens(room);
  return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
}

async function executeRoomMultiTargetAttack(
  roomId: string,
  attackerTokenId: string,
  defenderTokenIds: string[],
  author: { authorId: string; authorName: string; authorRole: ChatMessage["authorRole"] },
  opts: CombatActionRequest & { bypassTurn?: boolean } = {}
): Promise<AttackExecuteResult> {
  const uniqueIds = [...new Set(defenderTokenIds)];
  if (uniqueIds.length === 0) {
    return { ok: false, error: "Selecione pelo menos um alvo" };
  }

  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  let attacker = room.scene.tokens.find((t) => t.id === attackerTokenId);
  if (!attacker) return { ok: false, error: "Conjurador não encontrado" };

  attacker = ensureTokenCombatPa(room, attacker, { bypassTurn: opts.bypassTurn });
  const atkIdx = room.scene.tokens.findIndex((t) => t.id === attackerTokenId);
  if (atkIdx >= 0) {
    const tokens = [...room.scene.tokens];
    tokens[atkIdx] = attacker;
    room.scene = { ...room.scene, tokens };
    syncActorPaFromToken(room, attacker);
  }

  if (!attacker.linked || !attacker.actorId) {
    if (!isMonsterToken(attacker)) {
      return { ok: false, error: "Conjurador sem ficha linkada" };
    }
  }

  const actor =
    attacker.linked && attacker.actorId ? room.actors[attacker.actorId] ?? null : null;
  if (attacker.linked && attacker.actorId && !actor) {
    return { ok: false, error: "Ficha do conjurador não encontrada" };
  }

  const action = resolveRoomAttackAction(attacker, actor, opts);
  if (action.kind !== "spell") {
    return { ok: false, error: "Seleção múltipla só se aplica a magias" };
  }
  if (action.areaShape && action.areaShape !== "single") {
    return { ok: false, error: "Magia de área deve ser conjurada no mapa" };
  }

  const maxTargets = spellTargetCount(action);
  if (uniqueIds.length > maxTargets) {
    return { ok: false, error: `Esta magia permite no máximo ${maxTargets} alvo(s)` };
  }

  const defenders: BattleToken[] = [];
  for (const id of uniqueIds) {
    const d = room.scene.tokens.find((t) => t.id === id);
    if (!d) return { ok: false, error: "Alvo não encontrado" };
    defenders.push(d);
  }

  const turn = {
    activeTokenId: activeTokenId(room.combat),
    bypassTurn: opts.bypassTurn,
    combatRound: room.combat.round,
    combatHasOrder: Boolean(room.combat?.order?.length),
  };

  const paCheck = canAttackTarget(attacker, defenders[0]!, action, turn, {
    actor,
    channelExtraPa: opts.channelExtraPa,
  });
  if (!paCheck.ok) return { ok: false, error: paCheck.reason ?? "Magia inválida" };

  for (let i = 1; i < defenders.length; i++) {
    const check = canAttackTarget(attacker, defenders[i]!, action, turn, {
      actor,
      channelExtraPa: opts.channelExtraPa,
      skipPaCheck: true,
    });
    if (!check.ok) return { ok: false, error: check.reason ?? "Alvo inválido" };
  }

  maybeRecordCombatUndo(room, {
    tokenId: attackerTokenId,
    tokenName: attacker.name,
    kind: "attack",
    summary: action.label ?? action.name,
    bypassTurn: opts.bypassTurn,
  });

  const hpByToken = new Map<string, number>();
  const debuffByToken = new Map<string, Partial<BattleToken>>();
  const saveResults: SaveSpellResolution[] = [];
  const attackResults: AttackResolution[] = [];

  try {
    if (action.resolution === "save" && actor) {
      for (let i = 0; i < defenders.length; i++) {
        const defender = defenders[i]!;
        const defenderActor =
          defender.linked && defender.actorId ? room.actors[defender.actorId] ?? null : null;
        const res = resolveSaveSpell(attacker, defender, actor, defenderActor, action, turn, {
          channelExtraPa: opts.channelExtraPa,
          skipPaCheck: true,
        });
        if (i === 0) {
          res.summary = `${res.summary} (${defenders.length}/${maxTargets} alvo(s))`;
        } else {
          res.summary = `[${i + 1}/${defenders.length}] ${res.summary}`;
        }
        saveResults.push(res);
        hpByToken.set(defender.id, res.defenderHpAfter);
        const debuffPatch = defenderPatchAfterSaveSpell(defender, action, res.save, {
          round: room.combat.round,
          activeIndex: room.combat.activeIndex,
        });
        if (debuffPatch) debuffByToken.set(defender.id, debuffPatch);
      }
    } else {
      for (let i = 0; i < defenders.length; i++) {
        const defender = defenders[i]!;
        const raw = resolveTokenAttack(attacker, defender, action, actor, turn, undefined, room.scene.tokens, {
          channelExtraPa: opts.channelExtraPa,
          skipPaCheck: true,
        });
        const batch = Array.isArray(raw) ? raw : [raw];
        for (const res of batch) {
          const tagged = { ...res };
          if (defenders.length > 1) {
            tagged.summary = `[${i + 1}/${defenders.length}] ${tagged.summary}`;
          }
          attackResults.push(tagged);
          hpByToken.set(defender.id, tagged.defenderHpAfter);
          if (tagged.attackerHpAfter != null) {
            attacker = { ...attacker, vida: tagged.attackerHpAfter };
          }
        }
      }
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Magia inválida" };
  }

  const paCost = saveResults[0]?.paCost ?? attackResults[0]?.paCost ?? action.paCost;

  let spentAttacker = markActionRechargeUsed(
    applyPaSpend(attacker, paCost),
    action,
    room.combat.round
  );

  if (attackResults.length > 0) {
    const lastDefender = defenders[defenders.length - 1]!;
    const built = buildAttackModifiers(attacker, lastDefender, action);
    const anyHit = attackResults.some((r) => r.hit);
    const buffCleanup = attackerAfterAttack(
      attacker,
      action,
      built.consumeAttackerMark,
      built.consumeDefenderFinta,
      anyHit
    );
    spentAttacker = { ...spentAttacker, ...buffCleanup };
  }

  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      if (t.id === attackerTokenId) return { ...t, ...spentAttacker, id: t.id };
      const hp = hpByToken.get(t.id);
      const debuff = debuffByToken.get(t.id);
      if (hp != null || debuff) {
        const patched = hp != null ? patchTokenVitals(t, { vida: hp }) : t;
        return { ...patched, ...(debuff ?? {}), id: t.id };
      }
      return t;
    }),
  };

  syncActorPaFromToken(room, spentAttacker);

  for (const defender of defenders) {
    const hp = hpByToken.get(defender.id);
    if (hp == null) continue;
    if (defender.linked && defender.actorId && room.actors[defender.actorId]) {
      const d = room.actors[defender.actorId];
      room.actors[defender.actorId] = {
        ...d,
        resources: {
          ...d.resources,
          vida: { ...d.resources.vida, value: hp },
        },
        revision: d.revision + 1,
      };
    }
  }

  if (attacker.actorId && room.actors[attacker.actorId] && spentAttacker.vida != null) {
    const a = room.actors[attacker.actorId];
    room.actors[attacker.actorId] = {
      ...a,
      resources: {
        ...a.resources,
        vida: { ...a.resources.vida, value: spentAttacker.vida },
      },
      revision: a.revision + 1,
    };
  }

  for (const res of saveResults) {
    appendRoomChatMessage(room, {
      ...author,
      kind: "combat",
      text: res.summary,
      combat: {
        attackerTokenId: res.attackerTokenId,
        defenderTokenId: res.defenderTokenId,
        actionKind: "spell",
        weaponName: res.weaponName,
        resolution: "save",
        saveNatural: res.save.natural,
        saveTotal: res.save.total,
        saveDc: res.save.dc,
        saveSuccess: res.save.success,
        saveAttribute: res.save.attributeLabel,
        saveRollMode: res.save.rollMode,
        damageTotal: res.damage.total,
        defenderHpBefore: res.defenderHpBefore,
        defenderHpAfter: res.defenderHpAfter,
        detail: formatSaveChatDetail(res),
      },
    });

    if (shouldAnnounceDefeat(res.defenderHpBefore, res.defenderHpAfter)) {
      const def = defenders.find((d) => d.id === res.defenderTokenId);
      await recordMonsterDefeat(room, author, {
        defenderTokenId: res.defenderTokenId,
        defenderName: def?.name ?? "Alvo",
        attackerTokenId,
        hpBefore: res.defenderHpBefore,
      });
    }
  }

  for (const result of attackResults) {
    appendRoomChatMessage(room, {
      ...author,
      kind: "combat",
      text: result.summary,
      combat: {
        attackerTokenId: result.attackerTokenId,
        defenderTokenId: result.defenderTokenId,
        actionKind: result.actionKind,
        weaponName: result.weaponName,
        resolution: "attack",
        attackNatural: result.attack.natural,
        attackTotal: result.attack.total,
        attackRollMode: result.attack.rollMode,
        defenderAc: result.defenderAc,
        hit: result.hit,
        critical: result.critical,
        criticalFail: result.criticalFail,
        damageTotal: result.damage?.total ?? null,
        defenderHpBefore: result.defenderHpBefore,
        defenderHpAfter: result.defenderHpAfter,
        attackerHpBefore: result.attackerHpBefore,
        attackerHpAfter: result.attackerHpAfter,
        attackerHeal: result.attackerHeal,
        detail: formatAttackChatDetail(result),
        ...(result.actionKind === "spell" ? { spellDamageType: action.damageType } : {}),
      },
    });

    if (shouldAnnounceDefeat(result.defenderHpBefore, result.defenderHpAfter)) {
      const def = defenders.find((d) => d.id === result.defenderTokenId);
      await recordMonsterDefeat(room, author, {
        defenderTokenId: result.defenderTokenId,
        defenderName: def?.name ?? "Alvo",
        attackerTokenId,
        hpBefore: result.defenderHpBefore,
      });
    }
  }

  syncCombatOrderWithTokens(room);
  return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
}
