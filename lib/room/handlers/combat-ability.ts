import { resolveCombatAction } from "@/lib/combat/attack";
import {
  canAbilityTarget,
  canUseAbility,
  resolveAbilityUse,
  type AbilityResolution,
} from "@/lib/combat/ability";
import { abilityFromEntry } from "@/lib/combat/compendium-actions";
import { monsterCombatActions } from "@/lib/vtt/monster-actions";
import { prepareCombatToken, syncActorPaFromToken } from "@/lib/combat/combat-token-pa";
import { applyPaSpend } from "@/lib/combat/pa-turn";
import { markActionRechargeUsed } from "@/lib/combat/recharge";
import { enrichBuffsWithTimedEffects } from "@/lib/combat/timed-effects";
import { getEntry } from "@/lib/compendium/registry";
import { formatAttackChatDetail } from "@/lib/combat/attack";
import { formatSaveChatDetail } from "@/lib/combat/spell";
import type { CombatActionRequest } from "@/lib/combat/types";
import type { CharacterSheet } from "@/lib/character/types";
import type { BattleToken } from "@/lib/vtt/types";
import type { ChatMessage } from "../chat";
import { activeTokenId } from "../combat";
import { maybeRecordCombatUndo } from "../combat-undo";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot, RoomState } from "../types";
import { syncCombatOrderWithTokens } from "../combat-order";
import { shouldAnnounceDefeat } from "../combat-chat-events";
import { recordMonsterDefeat } from "../combat-xp";
import { appendRoomChatMessage } from "./chat";

export type AbilityExecuteResult =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

function resolveRoomAbilityAction(
  attacker: BattleToken,
  actor: CharacterSheet | null,
  opts: CombatActionRequest
) {
  if (actor) return resolveCombatAction(actor, opts);
  if (opts.entryId && attacker.monsterEntryId) {
    const fromMonster = monsterCombatActions(attacker.monsterEntryId).find(
      (a) => a.kind === "ability" && a.entryId === opts.entryId
    );
    if (fromMonster) return fromMonster;

    const entry = getEntry("habilidades", opts.entryId);
    if (entry) {
      const a = abilityFromEntry(entry);
      if (a) return a;
    }
  }
  throw new Error("Ação não é habilidade");
}

function applyAbilityToRoom(
  room: RoomState,
  attackerTokenId: string,
  defenderTokenId: string | null,
  resolved: AbilityResolution,
  action: import("@/lib/combat/types").CombatActionOption
): void {
  const attackerBefore = room.scene.tokens.find((t) => t.id === attackerTokenId);
  let spent = attackerBefore;
  if (attackerBefore && resolved.paCost > 0) {
    spent = markActionRechargeUsed(
      applyPaSpend(attackerBefore, resolved.paCost),
      action,
      room.combat.round
    );
  } else if (attackerBefore && action.recharge) {
    spent = markActionRechargeUsed(attackerBefore, action, room.combat.round);
  }

  if (spent && attackerBefore?.linked) {
    syncActorPaFromToken(room, { ...attackerBefore, ...spent });
  }

  const tickCtx = { round: room.combat.round, activeIndex: room.combat.activeIndex };

  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      if (t.id === attackerTokenId) {
        const base = spent ? { ...t, ...spent, id: t.id } : t;
        if (resolved.kind === "buff" || resolved.kind === "charge") {
          return enrichBuffsWithTimedEffects(
            base,
            resolved.attackerUpdate,
            action.abilityEffect,
            tickCtx
          );
        }
        if ("attackerUpdate" in resolved && resolved.attackerUpdate) {
          return enrichBuffsWithTimedEffects(
            base,
            resolved.attackerUpdate,
            action.abilityEffect,
            tickCtx
          );
        }
        return base;
      }
      if (defenderTokenId && t.id === defenderTokenId) {
        if (resolved.kind === "heal") {
          return { ...t, vida: resolved.defenderHpAfter };
        }
        if (resolved.kind === "mark" && resolved.defenderUpdate) {
          return enrichBuffsWithTimedEffects(t, resolved.defenderUpdate, action.abilityEffect, tickCtx);
        }
        if (resolved.kind === "ally_buff" && resolved.defenderUpdate) {
          return enrichBuffsWithTimedEffects(t, resolved.defenderUpdate, "ally_inspire", tickCtx);
        }
        if (resolved.kind === "spell_save" && resolved.defenderUpdate) {
          return { ...t, ...resolved.defenderUpdate, vida: resolved.save.defenderHpAfter };
        }
        if (
          (resolved.kind === "attack" || resolved.kind === "spell_strike") &&
          t.vidaMax != null
        ) {
          return { ...t, vida: resolved.attack.defenderHpAfter };
        }
      }
      return t;
    }),
  };

  const attacker = room.scene.tokens.find((t) => t.id === attackerTokenId);
  if (attacker?.linked && attacker.actorId && room.actors[attacker.actorId]) {
    const a = room.actors[attacker.actorId];
    room.actors[attacker.actorId] = {
      ...a,
      resources: {
        ...a.resources,
        pontosAcao: { ...a.resources.pontosAcao, value: spent?.pa ?? a.resources.pontosAcao.value },
      },
      revision: a.revision + 1,
    };
  }

  const defender = defenderTokenId
    ? room.scene.tokens.find((t) => t.id === defenderTokenId)
    : null;
  if (defender?.linked && defender.actorId && room.actors[defender.actorId]) {
    const hp =
      resolved.kind === "heal"
        ? resolved.defenderHpAfter
        : resolved.kind === "attack" || resolved.kind === "spell_strike"
          ? resolved.attack.defenderHpAfter
          : resolved.kind === "spell_save"
            ? resolved.save.defenderHpAfter
            : defender.vida;
    const d = room.actors[defender.actorId];
    room.actors[defender.actorId] = {
      ...d,
      resources: {
        ...d.resources,
        vida: { ...d.resources.vida, value: hp ?? d.resources.vida.value },
      },
      revision: d.revision + 1,
    };
  }
}

export async function executeRoomAbility(
  roomId: string,
  attackerTokenId: string,
  defenderTokenId: string | null,
  author: { authorId: string; authorName: string; authorRole: ChatMessage["authorRole"] },
  opts: CombatActionRequest & { bypassTurn?: boolean } = {}
): Promise<AbilityExecuteResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  let attacker = room.scene.tokens.find((t) => t.id === attackerTokenId);
  if (!attacker) return { ok: false, error: "Token não encontrado" };

  attacker = prepareCombatToken(room, attacker);
  const atkIdx = room.scene.tokens.findIndex((t) => t.id === attackerTokenId);
  if (atkIdx >= 0) {
    const tokens = [...room.scene.tokens];
    tokens[atkIdx] = attacker;
    room.scene = { ...room.scene, tokens };
    syncActorPaFromToken(room, attacker);
  }

  const actor =
    attacker.linked && attacker.actorId ? room.actors[attacker.actorId] ?? null : null;
  if (attacker.linked && attacker.actorId && !actor) {
    return { ok: false, error: "Ficha não encontrada" };
  }
  if (!actor && !attacker.monsterEntryId) {
    return { ok: false, error: "Habilidade requer ficha linkada ou monstro" };
  }

  let action;
  try {
    action = resolveRoomAbilityAction(attacker, actor, opts);
  } catch {
    return { ok: false, error: "Ação não é habilidade" };
  }
  if (action.kind !== "ability") {
    return { ok: false, error: "Ação não é habilidade" };
  }

  const turn = {
    activeTokenId: activeTokenId(room.combat),
    bypassTurn: opts.bypassTurn,
    combatRound: room.combat.round,
  };

  if (action.selfTarget) {
    const check = canUseAbility(attacker, action, turn, actor);
    if (!check.ok) return { ok: false, error: check.reason ?? "Habilidade inválida" };
  } else {
    if (!defenderTokenId) return { ok: false, error: "Alvo obrigatório" };
    const defender = room.scene.tokens.find((t) => t.id === defenderTokenId);
    if (!defender) return { ok: false, error: "Alvo não encontrado" };
    const targetCheck = canAbilityTarget(attacker, defender, action, turn, actor);
    if (!targetCheck.ok) return { ok: false, error: targetCheck.reason ?? "Alvo inválido" };
  }

  const defender = defenderTokenId
    ? room.scene.tokens.find((t) => t.id === defenderTokenId) ?? null
    : null;
  const defenderActor =
    defender?.linked && defender.actorId ? room.actors[defender.actorId] ?? null : null;

  let resolved: AbilityResolution;
  try {
    const atkForResolve =
      action.bonusDamageFormula && defender
        ? { ...attacker, bonusDamageFormula: action.bonusDamageFormula }
        : attacker;
    resolved = resolveAbilityUse(
      atkForResolve,
      defender,
      actor,
      action,
      room.scene.tokens,
      turn,
      defenderActor
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Habilidade inválida" };
  }

  maybeRecordCombatUndo(room, {
    tokenId: attackerTokenId,
    tokenName: attacker.name,
    kind: "ability",
    summary: action.name,
    bypassTurn: opts.bypassTurn,
  });

  applyAbilityToRoom(room, attackerTokenId, defenderTokenId, resolved, action);

  const defId = defenderTokenId ?? attackerTokenId;
  if (resolved.kind === "attack" || resolved.kind === "spell_strike") {
    const result = resolved.attack;
    appendRoomChatMessage(room, {
      ...author,
      kind: "combat",
      text: result.summary,
      combat: {
        attackerTokenId: result.attackerTokenId,
        defenderTokenId: result.defenderTokenId,
        actionKind: "ability",
        weaponName: action.name,
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
        detail: formatAttackChatDetail(result),
      },
    });
    if (defender && shouldAnnounceDefeat(result.defenderHpBefore, result.defenderHpAfter)) {
      await recordMonsterDefeat(room, author, {
        defenderTokenId: defender.id,
        defenderName: defender.name,
        attackerTokenId,
        hpBefore: result.defenderHpBefore,
      });
    }
  } else if (resolved.kind === "spell_save") {
    const save = resolved.save;
    appendRoomChatMessage(room, {
      ...author,
      kind: "combat",
      text: save.summary,
      combat: {
        attackerTokenId: save.attackerTokenId,
        defenderTokenId: save.defenderTokenId,
        actionKind: "ability",
        weaponName: action.name,
        resolution: "save",
        saveNatural: save.save.natural,
        saveTotal: save.save.total,
        saveDc: save.save.dc,
        saveSuccess: save.save.success,
        saveAttribute: save.save.attributeLabel,
        saveRollMode: save.save.rollMode,
        damageTotal: save.damage.total,
        defenderHpBefore: save.defenderHpBefore,
        defenderHpAfter: save.defenderHpAfter,
        detail: formatSaveChatDetail(save),
      },
    });
    if (defender && shouldAnnounceDefeat(save.defenderHpBefore, save.defenderHpAfter)) {
      await recordMonsterDefeat(room, author, {
        defenderTokenId: defender.id,
        defenderName: defender.name,
        attackerTokenId,
        hpBefore: save.defenderHpBefore,
      });
    }
  } else {
    const text =
      resolved.kind === "buff" || resolved.kind === "charge" || resolved.kind === "mark"
        ? resolved.summary
        : resolved.kind === "heal" || resolved.kind === "ally_buff"
          ? resolved.summary
          : action.name;
    appendRoomChatMessage(room, {
      ...author,
      kind: "combat",
      text,
      combat: {
        attackerTokenId,
        defenderTokenId: defId,
        actionKind: "ability",
        weaponName: action.name,
        damageTotal:
          resolved.kind === "heal"
            ? null
            : null,
        defenderHpBefore: defender?.vida ?? attacker.vida ?? 0,
        defenderHpAfter:
          resolved.kind === "heal" ? resolved.defenderHpAfter : defender?.vida ?? attacker.vida ?? 0,
        detail: text,
      },
    });
  }

  syncCombatOrderWithTokens(room);
  return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
}
