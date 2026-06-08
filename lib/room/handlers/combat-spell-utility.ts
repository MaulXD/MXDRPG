import { applyPaSpend } from "@/lib/combat/pa-turn";
import { markActionRechargeUsed } from "@/lib/combat/recharge";
import { resolveSpellUtility } from "@/lib/combat/spell-utility";
import { isAreaSpellAction } from "@/lib/combat/area-spell";
import type { CombatActionRequest } from "@/lib/combat/types";
import type { ChatMessage } from "../chat";
import { activeTokenId } from "../combat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import { syncCombatOrderWithTokens } from "../combat-order";
import { maybeRecordCombatUndo } from "../combat-undo";
import { appendRoomChatMessage } from "./chat";
import { resolveRoomAttackAction } from "@/lib/combat/attack";
import type { AttackExecuteResult } from "./combat-attack";

function needsSpellUtilityRoute(action: ReturnType<typeof resolveRoomAttackAction>): boolean {
  if (action.kind !== "spell" || isAreaSpellAction(action)) return false;
  if (action.spellEffect === "utility" || action.spellEffect === "ac_buff") return true;
  if (
    action.spellEffect === "stabilize" ||
    action.spellEffect === "cleanse" ||
    action.spellEffect === "revive"
  ) {
    return true;
  }
  if (action.spellEffect === "heal" && action.selfTarget) return true;
  if (action.selfTarget && action.damageFormula === "0" && !action.saveAttribute) return true;
  return false;
}

export function isSpellUtilityAction(action: ReturnType<typeof resolveRoomAttackAction>): boolean {
  return needsSpellUtilityRoute(action);
}

export async function executeRoomSpellUtility(
  roomId: string,
  casterTokenId: string,
  targetTokenId: string | null,
  author: { authorId: string; authorName: string; authorRole: ChatMessage["authorRole"] },
  opts: CombatActionRequest & { bypassTurn?: boolean } = {}
): Promise<AttackExecuteResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const caster = room.scene.tokens.find((t) => t.id === casterTokenId);
  if (!caster?.linked || !caster.actorId) {
    return { ok: false, error: "Conjurador sem ficha linkada" };
  }
  const actor = room.actors[caster.actorId];
  if (!actor) return { ok: false, error: "Ficha não encontrada" };

  const action = resolveRoomAttackAction(caster, actor, opts);
  if (!needsSpellUtilityRoute(action)) {
    return { ok: false, error: "Magia não é utilitária" };
  }

  const target =
    targetTokenId != null
      ? room.scene.tokens.find((t) => t.id === targetTokenId) ?? null
      : action.selfTarget
        ? caster
        : null;

  const turn = {
    activeTokenId: activeTokenId(room.combat),
    bypassTurn: opts.bypassTurn,
    combatRound: room.combat.round,
    combatHasOrder: Boolean(room.combat?.order?.length),
  };

  let result;
  try {
    result = resolveSpellUtility(caster, target, actor, action, turn);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Magia inválida" };
  }

  maybeRecordCombatUndo(room, {
    tokenId: casterTokenId,
    tokenName: caster.name,
    kind: "ability",
    summary: action.label ?? action.name,
    bypassTurn: opts.bypassTurn,
  });

  const spentCaster = markActionRechargeUsed(
    applyPaSpend(caster, result.paCost),
    action,
    room.combat.round
  );

  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      if (t.id === casterTokenId) {
        return { ...t, ...spentCaster, ...(result.casterUpdate ?? {}), id: t.id };
      }
      if (result.targetTokenId && t.id === result.targetTokenId) {
        const patch: typeof t = { ...t, ...(result.targetUpdate ?? {}), id: t.id };
        if (result.targetHpAfter != null && t.vidaMax != null) patch.vida = result.targetHpAfter;
        return patch;
      }
      return t;
    }),
  };

  if (result.targetTokenId && result.targetHpAfter != null) {
    const tgt = room.scene.tokens.find((t) => t.id === result.targetTokenId);
    if (tgt?.linked && tgt.actorId && room.actors[tgt.actorId]) {
      const d = room.actors[tgt.actorId];
      room.actors[tgt.actorId] = {
        ...d,
        resources: {
          ...d.resources,
          vida: { ...d.resources.vida, value: result.targetHpAfter },
        },
        revision: d.revision + 1,
      };
    }
  }

  const targetToken =
    result.targetTokenId != null
      ? room.scene.tokens.find((t) => t.id === result.targetTokenId)
      : caster;
  const hpBefore = targetToken?.vida ?? 0;

  appendRoomChatMessage(room, {
    ...author,
    kind: "combat",
    text: result.summary,
    combat: {
      attackerTokenId: casterTokenId,
      defenderTokenId: result.targetTokenId ?? casterTokenId,
      actionKind: "spell",
      weaponName: action.name,
      resolution: "attack",
      hit: true,
      damageTotal:
        result.targetHpAfter != null && result.targetHpAfter > hpBefore
          ? result.targetHpAfter - hpBefore
          : null,
      defenderHpBefore: hpBefore,
      defenderHpAfter: result.targetHpAfter ?? hpBefore,
      detail: result.summary,
    },
  });

  syncCombatOrderWithTokens(room);
  return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
}
