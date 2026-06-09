import {
  paMaxForActor,
  paTurnRulesForActor,
  paTurnRulesForMonster,
} from "@/lib/combat/pa-economy";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import { hasCondition } from "@/lib/combat/conditions";
import {
  accumulationCap,
  bankPaAtEndOfTurn,
  clearCombatPaPool,
  formatEndTurnPaDiscardNotice,
  formatStunSkipNotice,
  formatTurnStartCombatNotice,
  planEndOfTurnPaBank,
  refreshPaAtTurnStart,
  startTurnPaFull,
  tokenBankedPa,
  tokenSpendablePa,
} from "@/lib/combat/pa-turn";
import type { BattleToken } from "@/lib/vtt/types";
import { isMonsterToken } from "../settings";
import { activeTokenId, nextTurn, rollInitiative } from "../combat";
import { applyGmCombatOrder } from "../combat-gm";
import {
  getActiveBattleToken,
  shouldAutoSkipTurn,
  syncCombatOrderWithTokens,
} from "../combat-order";
import { clearCombatRecharges, clearPerTurnRecharges } from "@/lib/combat/recharge";
import {
  formatExpiredNotice,
  tickAllTimedEffectsOnNewRound,
  tickTokenTimedEffectsOnTurnEnd,
} from "@/lib/combat/timed-effects";
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
  const tickEnd = tickTokenTimedEffectsOnTurnEnd(tokens[idx]);
  for (const fx of tickEnd.expired) {
    notices.push(formatExpiredNotice(fx, tokens[idx].name));
  }
  tokens[idx] = tickEnd.token;

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

  if (
    !isMonsterToken(before) &&
    bankPlan &&
    bankPlan.discarded > 0
  ) {
    notices.push(
      formatEndTurnPaDiscardNotice(
        before.name,
        bankPlan.discarded,
        bankPlan.poolCap ?? accumulationCap(rules)
      )
    );
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

function pushTurnStartNotice(room: RoomState, notices: string[]): void {
  const active = getActiveBattleToken(room);
  if (!active) return;

  const carryBefore = Math.max(0, active.pa ?? 0) + tokenBankedPa(active);
  refreshActiveTokenPa(room);
  const refreshed = getActiveBattleToken(room);
  if (!refreshed) return;

  const rules = paRulesForToken(room, refreshed);
  notices.push(
    formatTurnStartCombatNotice(
      refreshed.name,
      room.combat.round,
      refreshed.pa ?? 0,
      rules,
      carryBefore
    )
  );
}

function pushTurnStartNoticeFull(room: RoomState, notices: string[]): void {
  const active = getActiveBattleToken(room);
  if (!active) return;

  refreshActiveTokenPa(room, "full");
  const refreshed = getActiveBattleToken(room);
  if (!refreshed) return;

  const rules = paRulesForToken(room, refreshed);
  notices.push(
    formatTurnStartCombatNotice(
      refreshed.name,
      room.combat.round,
      refreshed.pa ?? 0,
      rules,
      0
    )
  );
}

function stepToNextCombatant(room: RoomState, notices: string[]): void {
  const prevRound = room.combat.round;
  room.combat = nextTurn(room.combat);
  if (room.combat.round > prevRound) {
    const tick = tickAllTimedEffectsOnNewRound(room.scene.tokens);
    room.scene = { ...room.scene, tokens: tick.tokens };
    for (const { tokenId, fx } of tick.expired) {
      const name = room.scene.tokens.find((t) => t.id === tokenId)?.name ?? "Token";
      notices.push(formatExpiredNotice(fx, name));
    }
  }
  resetAllTokenMovement(room, notices);
}

function applyTurnPaTransition(room: RoomState): string[] {
  const notices: string[] = [];
  syncCombatOrderWithTokens(room);

  bankEndingToken(room, notices);
  stepToNextCombatant(room, notices);
  syncCombatOrderWithTokens(room);

  const maxSkips = Math.max(1, room.combat.order.length + 1);
  for (let i = 0; i < maxSkips; i++) {
    const active = getActiveBattleToken(room);
    if (!active) break;

    if (shouldAutoSkipTurn(active)) {
      if (active.conditions?.includes("atordoado")) {
        notices.push(formatStunSkipNotice(active.name));
      }
      stepToNextCombatant(room, notices);
      syncCombatOrderWithTokens(room);
      continue;
    }

    pushTurnStartNotice(room, notices);
    break;
  }

  return notices;
}

/** Passa turno automaticamente quando o token ativo esgota PA gastáveis. */
export function maybeAutoPassWhenActivePaZero(room: RoomState): boolean {
  if (!room.combat?.order?.length) return false;

  const active = getActiveBattleToken(room);
  if (!active) return false;
  if (hasCondition(active, "atordoado")) return false;
  if (tokenSpendablePa(active) > 0) return false;

  const transitionNotices = applyTurnPaTransition(room);
  room.combat = {
    ...room.combat,
    notices: [
      `PA esgotados — turno de ${active.name} passou automaticamente.`,
      ...transitionNotices,
    ],
  };
  return true;
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
  const initNotices: string[] = [];
  resetAllTokenMovement(room, initNotices);
  zeroAllTokenPaPools(room);

  const notices: string[] = [...initNotices];
  const maxSkips = Math.max(1, room.combat.order.length + 1);
  for (let i = 0; i < maxSkips; i++) {
    const active = getActiveBattleToken(room);
    if (!active) break;

    if (shouldAutoSkipTurn(active)) {
      if (active.conditions?.includes("atordoado")) {
        notices.push(formatStunSkipNotice(active.name));
      }
      stepToNextCombatant(room, notices);
      syncCombatOrderWithTokens(room);
      continue;
    }

    pushTurnStartNoticeFull(room, notices);
    break;
  }

  room.combat = { ...room.combat, notices };

  return toSnapshot(await persistRoom(roomId, room));
}

/** Garante PA no token ativo quando a ordem existe mas ninguém rolou iniciativa ainda. */
export function ensureCombatActiveHasPa(room: RoomState): void {
  if (!room.combat?.order?.length) return;
  const active = getActiveBattleToken(room);
  if (!active) return;
  if ((active.pa ?? 0) > 0) return;
  refreshActiveTokenPa(room, "full");
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
