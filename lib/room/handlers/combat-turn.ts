import {
  paMaxForActor,
  paTurnRulesForActor,
  paTurnRulesForMonster,
} from "@/lib/combat/pa-economy";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import {
  bankPaAtEndOfTurn,
  clearCombatPaPool,
  formatStunSkipNotice,
  formatTurnStartPaNotice,
  planEndOfTurnPaBank,
  refreshPaAtTurnStart,
  startTurnPaFull,
} from "@/lib/combat/pa-turn";
import type { BattleToken } from "@/lib/vtt/types";
import { activeTokenId, nextTurn, rollInitiative } from "../combat";
import { applyGmCombatOrder } from "../combat-gm";
import {
  getActiveBattleToken,
  shouldAutoSkipTurn,
  syncCombatOrderWithTokens,
} from "../combat-order";
import { clearCombatRecharges, clearPerTurnRecharges } from "@/lib/combat/recharge";
import { resetAllTokenMovement } from "../internal/token-reset";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot, RoomState } from "../types";

function paRulesForToken(room: RoomState, token: BattleToken) {
  if (token.linked && token.actorId && room.actors[token.actorId]) {
    return paTurnRulesForActor(room.actors[token.actorId]);
  }
  return paTurnRulesForMonster(token.monsterTier);
}

function paMaxForToken(room: RoomState, token: BattleToken): number {
  return paRulesForToken(room, token).recoveryPerTurn;
}

/** Zera pools de todos; só o ativo recebe PA na iniciativa. */
function zeroAllTokenPaPools(room: RoomState): void {
  const tokens = room.scene.tokens.map((t) => clearCombatPaPool(t));
  room.scene = { ...room.scene, tokens };

  for (const token of tokens) {
    if (!token.linked || !token.actorId) continue;
    const actor = room.actors[token.actorId];
    if (!actor) continue;
    room.actors[token.actorId] = {
      ...actor,
      resources: {
        ...actor.resources,
        pontosAcao: { ...actor.resources.pontosAcao, value: 0 },
      },
      revision: actor.revision + 1,
    };
  }
}

/** Garante PA do token ativo na iniciativa (demo / sala nova). */
export function initCombatPaForRoom(room: RoomState): void {
  zeroAllTokenPaPools(room);
  refreshActiveTokenPa(room, "full");
}

function refreshActiveTokenPa(room: RoomState, mode: "full" | "regen" = "regen"): void {
  const startingId = activeTokenId(room.combat);
  if (!startingId) return;

  const idx = room.scene.tokens.findIndex((t) => t.id === startingId);
  if (idx < 0) return;

  const token = room.scene.tokens[idx];
  const actor = token.actorId ? room.actors[token.actorId] : null;
  const rules = actor ? paTurnRulesForActor(actor) : paTurnRulesForMonster(token.monsterTier);
  const paMax = rules.recoveryPerTurn;

  const tokens = [...room.scene.tokens];
  const refreshed =
    mode === "full" ? startTurnPaFull(token, rules) : refreshPaAtTurnStart(token, rules);
  tokens[idx] = clearPerTurnRecharges({
    ...token,
    ...normalizeTokenPaFields(refreshed, paMax),
  });

  if (actor && token.linked && token.actorId) {
    room.actors[token.actorId] = {
      ...actor,
      resources: {
        ...actor.resources,
        pontosAcao: { ...actor.resources.pontosAcao, value: tokens[idx].pa, max: paMax },
      },
      revision: actor.revision + 1,
    };
  }

  room.scene = { ...room.scene, tokens };
}

function bankEndingToken(room: RoomState, notices: string[]): void {
  const endingId = activeTokenId(room.combat);
  if (!endingId) return;

  const idx = room.scene.tokens.findIndex((t) => t.id === endingId);
  if (idx < 0) return;

  const tokens = [...room.scene.tokens];
  const before = tokens[idx];
  const rules = paRulesForToken(room, before);
  const paMax = rules.recoveryPerTurn;
  const bankPlan = planEndOfTurnPaBank(before, rules);

  const ended = {
    ...before,
    ...normalizeTokenPaFields(bankPaAtEndOfTurn(before, rules), paMax),
  };
  tokens[idx] = ended;
  room.scene = { ...room.scene, tokens };

  if (bankPlan && bankPlan.remaining > 0 && bankPlan.saved > 0) {
    const savedLabel = bankPlan.saved === 1 ? "1 PA" : `${bankPlan.saved} PA`;
    notices.push(`${before.name}: ${savedLabel} guardados para o próximo turno.`);
  }

  if (ended.linked && ended.actorId && room.actors[ended.actorId]) {
    const a = room.actors[ended.actorId];
    room.actors[ended.actorId] = {
      ...a,
      resources: {
        ...a.resources,
        pontosAcao: {
          ...a.resources.pontosAcao,
          value: ended.pa,
          max: paMax,
        },
      },
      revision: a.revision + 1,
    };
  }
}

function stepToNextCombatant(room: RoomState): void {
  room.combat = nextTurn(room.combat);
  resetAllTokenMovement(room);
}

function applyTurnPaTransition(room: RoomState): string[] {
  const notices: string[] = [];
  syncCombatOrderWithTokens(room);

  bankEndingToken(room, notices);
  stepToNextCombatant(room);
  syncCombatOrderWithTokens(room);

  const maxSkips = Math.max(1, room.combat.order.length + 1);
  for (let i = 0; i < maxSkips; i++) {
    const active = getActiveBattleToken(room);
    if (!active) break;

    if (shouldAutoSkipTurn(active)) {
      if (active.conditions?.includes("atordoado")) {
        notices.push(formatStunSkipNotice(active.name));
      }
      stepToNextCombatant(room);
      syncCombatOrderWithTokens(room);
      continue;
    }

    refreshActiveTokenPa(room);
    const refreshed = getActiveBattleToken(room);
    if (refreshed) {
      notices.push(formatTurnStartPaNotice(refreshed.name, refreshed.pa ?? 0));
    }
    break;
  }

  return notices;
}

export async function rollRoomInitiative(roomId: string): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const { order, scores } = rollInitiative(room);
  room.combat = {
    order,
    activeIndex: 0,
    round: 1,
    notices: [],
    naturalOrder: order,
    orderOverridden: false,
  };
  room.combatUndo = [];
  room.scene = {
    ...room.scene,
    tokens: clearCombatRecharges(
      room.scene.tokens.map((t) => ({
        ...t,
        initiative: scores[t.id] ?? t.initiative,
      }))
    ),
  };
  syncCombatOrderWithTokens(room);
  resetAllTokenMovement(room);
  zeroAllTokenPaPools(room);

  const notices: string[] = [];
  const maxSkips = Math.max(1, room.combat.order.length + 1);
  for (let i = 0; i < maxSkips; i++) {
    const active = getActiveBattleToken(room);
    if (!active) break;

    if (shouldAutoSkipTurn(active)) {
      if (active.conditions?.includes("atordoado")) {
        notices.push(formatStunSkipNotice(active.name));
      }
      stepToNextCombatant(room);
      syncCombatOrderWithTokens(room);
      continue;
    }

    refreshActiveTokenPa(room, "full");
    const refreshed = getActiveBattleToken(room);
    if (refreshed) {
      notices.push(formatTurnStartPaNotice(refreshed.name, refreshed.pa ?? 0));
    }
    break;
  }

  room.combat = { ...room.combat, notices };

  return toSnapshot(await persistRoom(roomId, room));
}

export async function advanceRoomTurn(roomId: string): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const notices = applyTurnPaTransition(room);
  room.combat = { ...room.combat, notices };

  return toSnapshot(await persistRoom(roomId, room));
}

export async function setRoomCombatOrder(
  roomId: string,
  order: string[]
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  room.combat = applyGmCombatOrder(room.combat, room, order);

  return toSnapshot(await persistRoom(roomId, room));
}
