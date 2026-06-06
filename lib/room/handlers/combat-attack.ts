import {
  attackerAfterAttack,
  buildAttackModifiers,
  formatAttackChatDetail,
  listTokenCombatActions,
  resolveCombatAction,
  resolveTokenAttack,
} from "@/lib/combat/attack";
import { formatSaveChatDetail, resolveSaveSpell } from "@/lib/combat/spell";
import { prepareCombatToken, syncActorPaFromToken } from "@/lib/combat/combat-token-pa";
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
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  let attacker = room.scene.tokens.find((t) => t.id === attackerTokenId);
  const defender = room.scene.tokens.find((t) => t.id === defenderTokenId);
  if (!attacker || !defender) return { ok: false, error: "Token não encontrado" };

  attacker = prepareCombatToken(room, attacker);
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

  const action = actor
    ? resolveCombatAction(actor, opts)
    : (listTokenCombatActions(attacker, null).find(
        (a) => opts.packId && a.packId === opts.packId && a.entryId === opts.entryId
      ) ?? listTokenCombatActions(attacker, null)[0]);

  if (action.kind === "ability") {
    return executeRoomAbility(roomId, attackerTokenId, defenderTokenId, author, opts);
  }

  if (action.areaShape && action.areaShape !== "single") {
    return { ok: false, error: "Magia de área deve ser conjurada no mapa (centro da área)" };
  }

  const turn = {
    activeTokenId: activeTokenId(room.combat),
    bypassTurn: opts.bypassTurn,
    combatRound: room.combat.round,
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
    room.scene = {
      ...room.scene,
      tokens: room.scene.tokens.map((t) => {
        if (t.id === attackerTokenId) return { ...t, ...spentAttacker, id: t.id };
        if (t.id === defenderTokenId && t.vidaMax != null) {
          return { ...t, vida: saveResult.defenderHpAfter };
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
  const buffCleanup = attackerAfterAttack(
    attacker,
    action,
    built.consumeAttackerMark,
    built.consumeDefenderFinta,
    last.hit
  );

  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      if (t.id === attackerTokenId) {
        const patch: typeof t = { ...t, ...spentAttacker, ...buffCleanup, id: t.id };
        if (finalAttackerHp != null && t.vidaMax != null) patch.vida = finalAttackerHp;
        return patch;
      }
      if (t.id === defenderTokenId && t.vidaMax != null) return { ...t, vida: finalHp };
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
        vida: { ...d.resources.vida, value: finalHp },
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
