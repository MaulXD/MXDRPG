import { formatStunSkipNotice } from "@/lib/combat/pa-turn";
import {
  bankActiveTokenPa,
  clearActiveTurnPaGrant,
  clearPendingAutoPass,
  enterCombatPaEconomy,
  onTurnStart,
  resetPoolsForTurnCombat,
  shouldExecuteAutoPass,
  zeroAllCombatPaPools,
} from "@/lib/combat/combat-pa-engine";
import { clearCombatRecharges } from "@/lib/combat/recharge";
import {
  chiMaxForEspiritualista,
  isEspiritualista,
  resetTokenChi,
} from "@/lib/combat/chi-economy";
import {
  formatExpiredNotice,
  tickAllTimedEffectsOnNewRound,
  tickTokenTimedEffectsOnTurnEnd,
  type CombatTickContext,
} from "@/lib/combat/timed-effects";
import { tickDeathTrackOnRound } from "@/lib/combat/death-track";
import { activeTokenId, nextTurn, rollInitiative } from "../combat";
import { applyGmCombatOrder } from "../combat-gm";
import {
  applyMapPlacementCombatOrder,
  combatHasRolledInitiative,
  getActiveBattleToken,
  isDefeatedToken,
  shouldAutoSkipTurn,
  reconcileCombatOrderPreservingActive,
  syncCombatOrderWithTokens,
} from "../combat-order";
import { resetAllTokenMovement } from "../internal/token-reset";
import { pushRoundCheckpoint } from "../combat-round-checkpoint";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import { clearCombatLog, logCombatEvent } from "../combat-log";
import type { RoomSnapshot, RoomState } from "../types";

export { COMBAT_AUTO_PASS_DELAY_MS } from "./combat-turn-constants";
export {
  scheduleAutoPassWhenActivePaZero,
  enterCombatPaEconomy,
} from "@/lib/combat/combat-pa-engine";

function resetChiPoolsForCombat(room: RoomState): void {
  const tokens = room.scene.tokens.map((t) => {
    if (t.linked && t.actorId) {
      const actor = room.actors[t.actorId];
      if (actor && isEspiritualista(actor)) {
        return resetTokenChi(t, chiMaxForEspiritualista());
      }
    }
    if (t.chi != null || t.chiMax != null || t.chiSpentThisTurn) {
      const { chi: _c, chiMax: _m, chiSpentThisTurn: _s, ...rest } = t;
      return rest;
    }
    return t;
  });
  room.scene = { ...room.scene, tokens };
}

/**
 * Um Anel — "se uma criatura começa uma rodada sem pontos de Ódio ou Resolução,
 * ela é considerada Exausta" (08-mestre-e-adversarios.md).
 *
 * Roda na virada de rodada, e não na hora da rolagem, porque o livro garante ao
 * Mestre o direito de gastar o último ponto numa Habilidade Sinistra: derivar de
 * `hate <= 0` na hora puniria esse gasto já na mesma rodada.
 *
 * Guardado por `rpgSystemId` — isolamento de hub: nenhuma mesa do Eldarin toca
 * neste campo.
 */
function applyTorHateWearinessOnNewRound(room: RoomState): void {
  if (room.rpgSystemId !== "um-anel") return;
  let changed = false;
  const tokens = room.scene.tokens.map((t) => {
    const c = t.torCombat;
    if (c?.kind !== "adversary" || c.hate == null) return t;
    const weary = c.hate <= 0;
    if (Boolean(c.weary) === weary) return t;
    changed = true;
    return { ...t, torCombat: { ...c, weary } };
  });
  if (changed) room.scene = { ...room.scene, tokens };
}

function stepToNextCombatant(room: RoomState, notices: string[]): void {
  const prevRound = room.combat.round;
  clearActiveTurnPaGrant(room);
  room.combat = nextTurn(room.combat);
  if (room.combat.round > prevRound) {
    applyTorHateWearinessOnNewRound(room);
    pushRoundCheckpoint(room);
    const tick = tickAllTimedEffectsOnNewRound(room.scene.tokens, prevRound);
    const tokens = tick.tokens.map((t) => tickDeathTrackOnRound(t));
    room.scene = { ...room.scene, tokens };
    for (const { tokenId, fx } of tick.expired) {
      const name = room.scene.tokens.find((t) => t.id === tokenId)?.name ?? "Token";
      notices.push(formatExpiredNotice(fx, name));
    }
  }
  resetAllTokenMovement(room, notices);
}

function bankEndingToken(room: RoomState, notices: string[]): void {
  const endingId = activeTokenId(room.combat);
  if (!endingId) return;

  const ending = getActiveBattleToken(room);
  if (ending) {
    logCombatEvent(room, "turn_pass", `Fim da vez — ${ending.name}`, {
      tokenId: ending.id,
      tokenName: ending.name,
      paAfter: ending.pa ?? 0,
      detail: `gastou ${ending.paSpentThisTurn ?? 0} PA neste turno`,
    });
  }

  const idx = room.scene.tokens.findIndex((t) => t.id === endingId);
  if (idx < 0) return;

  const tokens = [...room.scene.tokens];
  const turnCtx: CombatTickContext = {
    round: room.combat.round,
    activeIndex: room.combat.activeIndex,
  };
  const tickEnd = tickTokenTimedEffectsOnTurnEnd(tokens[idx], turnCtx);
  for (const fx of tickEnd.expired) {
    notices.push(formatExpiredNotice(fx, tokens[idx].name));
  }
  tokens[idx] = tickEnd.token;
  room.scene = { ...room.scene, tokens };

  bankActiveTokenPa(room, notices);
}

function skipDeadOrStunnedTurn(room: RoomState, notices: string[]): boolean {
  const active = getActiveBattleToken(room);
  if (!active || !shouldAutoSkipTurn(active)) return false;

  if (isDefeatedToken(active)) {
    notices.push(`${active.name} está morto — turno passado.`);
  } else if (active.conditions?.includes("atordoado")) {
    notices.push(formatStunSkipNotice(active.name));
  }
  stepToNextCombatant(room, notices);
  return true;
}

function startActiveTurn(room: RoomState, notices: string[], mode: "full" | "regen"): void {
  reconcileCombatOrderPreservingActive(room);
  onTurnStart(room, notices, mode);
}

function applyTurnPaTransition(room: RoomState): string[] {
  const notices: string[] = [];
  clearPendingAutoPass(room);
  syncCombatOrderWithTokens(room);

  bankEndingToken(room, notices);
  stepToNextCombatant(room, notices);

  const maxSkips = Math.max(1, room.combat.order.length + 1);
  for (let i = 0; i < maxSkips; i++) {
    if (skipDeadOrStunnedTurn(room, notices)) continue;
    startActiveTurn(room, notices, "regen");
    break;
  }

  return notices;
}

export function initCombatPaForRoom(room: RoomState): void {
  beginCombatTurnEconomyPa(room);
}

/** Entrada na fila de turnos: zera pools, limpa auto-passe e concede PA ao ativo. */
export function beginCombatTurnEconomyPa(room: RoomState): void {
  if (!room.combat?.order?.length) return;

  room.combat = { ...room.combat, notices: [] };
  syncCombatOrderWithTokens(room);
  const notices: string[] = [];
  resetAllTokenMovement(room, notices);
  resetPoolsForTurnCombat(room);
  resetChiPoolsForCombat(room);

  const maxSkips = Math.max(1, room.combat.order.length + 1);
  for (let i = 0; i < maxSkips; i++) {
    if (skipDeadOrStunnedTurn(room, notices)) continue;
    startActiveTurn(room, notices, "full");
    break;
  }

  room.combat = { ...room.combat, notices };
}

/** Liga combate: ordem do mapa (sem iniciativa) ou fila já rolada; PA de turno se houver fila. */
export function activateCombatMode(room: RoomState): { hasTurnOrder: boolean } {
  if (combatHasRolledInitiative(room.combat)) {
    syncCombatOrderWithTokens(room);
  } else if (applyMapPlacementCombatOrder(room)) {
    const names = room.combat.order
      .map((id) => room.scene.tokens.find((t) => t.id === id)?.name ?? id)
      .join(" · ");
    logCombatEvent(room, "initiative", `Ordem do mapa — ${room.combat.order.length} na fila`, {
      detail: names,
    });
  }

  if (room.combat.order.length) {
    beginCombatTurnEconomyPa(room);
    return { hasTurnOrder: true };
  }

  enterCombatPaEconomy(room);
  return { hasTurnOrder: false };
}

export function executePendingAutoPassIfDue(
  room: RoomState,
  opts?: { force?: boolean }
): boolean {
  if (!shouldExecuteAutoPass(room, opts)) return false;

  const active = getActiveBattleToken(room);
  if (!active) return false;

  const activeName = active.name;
  logCombatEvent(room, "auto_pass", `Auto-passe executado — ${activeName}`, {
    tokenId: active.id,
    tokenName: activeName,
    paAfter: 0,
  });
  clearPendingAutoPass(room);
  const transitionNotices = applyTurnPaTransition(room);
  room.combat = {
    ...room.combat,
    notices: [
      `PA esgotados — turno de ${activeName} passou automaticamente.`,
      ...transitionNotices,
    ],
  };
  return true;
}

/** Auto-passe vencido — chamado pelo SSE da mesa (não bloqueia mutações como ataque). */
export async function tickRoomAutoPass(roomId: string): Promise<boolean> {
  const room = await getRoom(roomId, { skipAutoPass: true });
  if (!room?.combat?.order?.length) return false;
  if (!executePendingAutoPassIfDue(room)) return false;
  await persistRoom(roomId, room, { skipAutoPassSchedule: true });
  return true;
}

export async function rollRoomInitiative(roomId: string): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const wasCombatActive = room.settings.combatActive;
  const hadOrder = Boolean(room.combat?.order?.length);
  const preservePaPools = wasCombatActive && hadOrder;

  const { order, scores } = rollInitiative(room);
  room.settings = { ...room.settings, combatActive: true };
  room.combat = {
    order,
    activeIndex: 0,
    round: preservePaPools ? room.combat.round : 1,
    notices: [],
    naturalOrder: order,
    orderOverridden: false,
    initiativeRolled: true,
    paRefreshTurnKey: undefined,
    pendingAutoPass: undefined,
  };
  room.combatUndo = [];
  clearCombatLog(room);
  logCombatEvent(room, "initiative", `Iniciativa rolada — ${order.length} na fila`, {
    detail: order
      .map((id) => {
        const t = room.scene.tokens.find((tok) => tok.id === id);
        return t ? `${t.name} (${scores[id] ?? "?"})` : id;
      })
      .join(" · "),
  });
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

  const notices: string[] = [];
  resetAllTokenMovement(room, notices);
  if (!preservePaPools) {
    zeroAllCombatPaPools(room);
    resetChiPoolsForCombat(room);
  }

  const maxSkips = Math.max(1, room.combat.order.length + 1);
  for (let i = 0; i < maxSkips; i++) {
    if (skipDeadOrStunnedTurn(room, notices)) continue;
    startActiveTurn(room, notices, preservePaPools ? "regen" : "full");
    break;
  }

  room.combat = { ...room.combat, notices };

  return toSnapshot(
    await persistRoom(roomId, room, { skipAutoPass: true, skipAutoPassSchedule: true })
  );
}

export async function advanceRoomTurn(
  roomId: string,
  opts?: { force?: boolean; room?: RoomState }
): Promise<RoomSnapshot | null> {
  const room = opts?.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return null;

  if (!opts?.force) {
    if (executePendingAutoPassIfDue(room)) {
      return toSnapshot(await persistRoom(roomId, room, { skipAutoPassSchedule: true }));
    }
    return toSnapshot(room);
  }

  const notices = applyTurnPaTransition(room);
  room.combat = { ...room.combat, notices };

  return toSnapshot(await persistRoom(roomId, room, { skipAutoPassSchedule: true }));
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
