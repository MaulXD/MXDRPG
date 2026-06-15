import {
  paTurnRulesForActor,
  paTurnRulesForMonster,
  type PaTurnRules,
} from "@/lib/combat/pa-economy";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import {
  bankPaAtEndOfTurn,
  clearCombatPaPool,
  formatEndTurnPaDiscardNotice,
  formatTurnStartCombatNotice,
  planEndOfTurnPaBank,
  refreshPaAtTurnStart,
  startTurnPaFull,
  tokenPaSpentThisTurn,
  tokenSpendablePa,
} from "@/lib/combat/pa-turn";
import { syncActorPaFromToken } from "@/lib/combat/combat-token-pa";
import {
  requiresCombatPaEconomy,
  requiresCombatTurnEconomy,
  isExplorationMode,
} from "@/lib/combat/mesa-mode";
import { tokenMayActWithZeroSpendablePa } from "@/lib/combat/zero-pa-options";
import { clearPerTurnRecharges } from "@/lib/combat/recharge";
import { resetChiSpentThisTurn } from "@/lib/combat/chi-economy";
import { activeTokenId } from "@/lib/room/combat";
import { isMonsterToken } from "@/lib/room/settings";
import { DEFAULT_AUTO_PASS_DELAY_MS, MIN_AUTO_PASS_DELAY_MS } from "@/lib/room/settings";
import { getActiveBattleToken } from "@/lib/room/combat-order";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

export function autoPassDelayMs(room: RoomState): number {
  const raw = room.settings.autoPassDelayMs ?? DEFAULT_AUTO_PASS_DELAY_MS;
  return Math.max(MIN_AUTO_PASS_DELAY_MS, raw);
}

export function paRulesForRoomToken(room: RoomState, token: BattleToken): PaTurnRules {
  if (token.linked && token.actorId && room.actors[token.actorId]) {
    return paTurnRulesForActor(room.actors[token.actorId]);
  }
  return paTurnRulesForMonster(token.monsterTier);
}

/** Chave idempotente do turno ativo (`round:tokenId`). */
export function activeTurnPaKey(room: RoomState): string {
  const id = activeTokenId(room.combat);
  if (!id) return "";
  return `${room.combat.round}:${id}`;
}

export function isActiveTurnPaGranted(room: RoomState): boolean {
  const key = activeTurnPaKey(room);
  return Boolean(key && room.combat.paRefreshTurnKey === key);
}

export function markActiveTurnPaGranted(room: RoomState): void {
  const key = activeTurnPaKey(room);
  if (!key) return;
  room.combat = { ...room.combat, paRefreshTurnKey: key };
}

export function clearActiveTurnPaGrant(room: RoomState): void {
  if (!room.combat.paRefreshTurnKey) return;
  room.combat = { ...room.combat, paRefreshTurnKey: undefined };
}

function applyTokenPaRefresh(
  room: RoomState,
  tokenIdx: number,
  mode: "full" | "regen"
): void {
  const token = room.scene.tokens[tokenIdx];
  const rules = paRulesForRoomToken(room, token);
  const paMax = rules.recoveryPerTurn;

  const tokens = [...room.scene.tokens];
  const refreshed =
    mode === "full" ? startTurnPaFull(token, rules) : refreshPaAtTurnStart(token, rules);
  const merged = {
    ...token,
    ...normalizeTokenPaFields(refreshed, paMax, rules.accumulationCap),
  };
  tokens[tokenIdx] = clearPerTurnRecharges(resetChiSpentThisTurn(merged));
  room.scene = { ...room.scene, tokens };
  syncActorPaFromToken(room, tokens[tokenIdx]!);
}

/** Concede PA completo a um token (início de combate / combate livre). */
export function grantFullCombatPaToToken(room: RoomState, tokenId: string): void {
  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return;
  applyTokenPaRefresh(room, idx, "full");
}

/** Combate ligado sem iniciativa: todos no mapa recebem PA imediato. */
export function grantCombatPaToAllTokens(room: RoomState): void {
  const tokens = room.scene.tokens.map((t) => {
    const rules = paRulesForRoomToken(room, t);
    const cleared = clearCombatPaPool(t);
    const granted = startTurnPaFull(cleared, rules);
    return {
      ...t,
      ...normalizeTokenPaFields(granted, rules.recoveryPerTurn, rules.accumulationCap),
    };
  });
  room.scene = { ...room.scene, tokens };
  for (const token of tokens) {
    syncActorPaFromToken(room, token);
  }
}

/** Zera pools de combate em todos os tokens (entrada na fila de turnos). */
export function zeroAllCombatPaPools(room: RoomState): void {
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

/** Token precisa de refresh no início da vez (0 gastável, nada gasto neste turno). */
export function tokenNeedsTurnStartPaRefresh(token: BattleToken): boolean {
  if (tokenSpendablePa(token) > 0) return false;
  if (tokenPaSpentThisTurn(token) > 0) return false;
  return true;
}

/** Início de turno do token ativo. */
export function refreshActiveTokenAtTurnStart(
  room: RoomState,
  mode: "full" | "regen" = "regen"
): { refreshed: boolean; carryBefore: number } {
  const active = getActiveBattleToken(room);
  if (!active) return { refreshed: false, carryBefore: 0 };

  const idx = room.scene.tokens.findIndex((t) => t.id === active.id);
  if (idx < 0) return { refreshed: false, carryBefore: 0 };

  const before = room.scene.tokens[idx]!;
  const carryBefore = Math.max(0, before.pa ?? 0);

  if (!tokenNeedsTurnStartPaRefresh(before)) {
    return { refreshed: false, carryBefore };
  }

  applyTokenPaRefresh(room, idx, mode);
  markActiveTurnPaGranted(room);
  return { refreshed: true, carryBefore };
}

export function pushTurnStartNotice(
  room: RoomState,
  notices: string[],
  mode: "full" | "regen" = "regen"
): void {
  const activeBefore = getActiveBattleToken(room);
  if (!activeBefore) return;

  const { refreshed, carryBefore } = refreshActiveTokenAtTurnStart(room, mode);
  const active = getActiveBattleToken(room);
  if (!active) return;

  if (!refreshed && tokenNeedsTurnStartPaRefresh(active)) {
    const idx = room.scene.tokens.findIndex((t) => t.id === active.id);
    if (idx >= 0) {
      applyTokenPaRefresh(room, idx, mode);
      markActiveTurnPaGranted(room);
    }
  }

  const finalActive = getActiveBattleToken(room);
  if (!finalActive) return;

  const rules = paRulesForRoomToken(room, finalActive);
  notices.push(
    formatTurnStartCombatNotice(
      finalActive.name,
      room.combat.round,
      finalActive.pa ?? 0,
      rules,
      mode === "full" ? 0 : carryBefore
    )
  );
}

export function bankActiveTokenPa(room: RoomState, notices: string[]): void {
  const endingId = activeTokenId(room.combat);
  if (!endingId) return;

  const idx = room.scene.tokens.findIndex((t) => t.id === endingId);
  if (idx < 0) return;

  const tokens = [...room.scene.tokens];
  const before = tokens[idx]!;
  const rules = paRulesForRoomToken(room, before);
  const paMax = rules.recoveryPerTurn;
  const bankPlan = planEndOfTurnPaBank(before, rules);

  tokens[idx] = clearPerTurnRecharges({
    ...before,
    ...normalizeTokenPaFields(bankPaAtEndOfTurn(before, rules), paMax, rules.accumulationCap),
  });
  room.scene = { ...room.scene, tokens };
  syncActorPaFromToken(room, tokens[idx]!);

  if (!isMonsterToken(before) && bankPlan && bankPlan.discarded > 0) {
    notices.push(
      formatEndTurnPaDiscardNotice(
        before.name,
        bankPlan.discarded,
        bankPlan.poolCap ?? rules.accumulationCap
      )
    );
  }
}

export function clearPendingAutoPass(room: RoomState): void {
  if (!room.combat?.pendingAutoPass) return;
  room.combat = { ...room.combat, pendingAutoPass: undefined };
}

/** Só auto-passe se o ativo gastou PA neste turno e não tem opções grátis. */
export function shouldScheduleAutoPass(room: RoomState, token: BattleToken): boolean {
  if (tokenSpendablePa(token) > 0) return false;
  if (tokenMayActWithZeroSpendablePa(room, token)) return false;
  return tokenPaSpentThisTurn(token) > 0;
}

export function scheduleAutoPassWhenActivePaZero(room: RoomState): boolean {
  if (!requiresCombatTurnEconomy(room.settings, room.combat)) {
    clearPendingAutoPass(room);
    return false;
  }
  if (!room.combat?.order?.length) return false;

  const active = getActiveBattleToken(room);
  if (!active) return false;

  if (!shouldScheduleAutoPass(room, active)) {
    clearPendingAutoPass(room);
    return false;
  }

  const pending = room.combat.pendingAutoPass;
  if (pending?.tokenId === active.id) {
    return pending.passAt <= Date.now();
  }

  room.combat = {
    ...room.combat,
    pendingAutoPass: {
      tokenId: active.id,
      passAt: Date.now() + autoPassDelayMs(room),
    },
  };
  return true;
}

export function executePendingAutoPassIfDue(
  room: RoomState,
  opts?: { force?: boolean }
): boolean {
  const pending = room.combat?.pendingAutoPass;
  if (!pending) return false;
  if (!opts?.force && Date.now() < pending.passAt) return false;

  const active = getActiveBattleToken(room);
  if (!active || active.id !== pending.tokenId) {
    clearPendingAutoPass(room);
    return false;
  }
  if (!shouldScheduleAutoPass(room, active)) {
    clearPendingAutoPass(room);
    return false;
  }

  return true;
}

/** Garante pool gastável antes de validar/debitar PA (servidor). */
export function applyCombatSpendablePaIfDue(
  room: RoomState,
  tokenId: string,
  opts?: { bypassTurn?: boolean }
): BattleToken | null {
  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return null;

  const token = room.scene.tokens[idx]!;
  if (isExplorationMode(room.settings, room.combat)) return token;

  const spendable = tokenSpendablePa(token);
  const spent = tokenPaSpentThisTurn(token);
  if (spendable > 0 || spent > 0) return token;

  const hasOrder = requiresCombatTurnEconomy(room.settings, room.combat);
  if (hasOrder) {
    const activeId = activeTokenId(room.combat);
    if (!opts?.bypassTurn && token.id !== activeId) return token;
  }

  if (!requiresCombatPaEconomy(room.settings, room.combat)) return token;
  if (!tokenNeedsTurnStartPaRefresh(token)) return token;

  applyTokenPaRefresh(room, idx, hasOrder ? "regen" : "full");
  if (hasOrder) markActiveTurnPaGranted(room);
  return room.scene.tokens[idx] ?? null;
}

/** PA de token recém-colocado no mapa. */
export function prepareSpawnedTokenPa(room: RoomState, tokenId: string): void {
  if (isExplorationMode(room.settings, room.combat)) return;

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return;

  if (requiresCombatTurnEconomy(room.settings, room.combat)) {
    const cleared = clearCombatPaPool(room.scene.tokens[idx]!);
    const tokens = [...room.scene.tokens];
    tokens[idx] = cleared;
    room.scene = { ...room.scene, tokens };
    syncActorPaFromToken(room, cleared);
    return;
  }

  if (requiresCombatPaEconomy(room.settings, room.combat)) {
    grantFullCombatPaToToken(room, tokenId);
  }
}

/** Entrada em combate sem fila de turnos — PA para todos. */
export function enterCombatPaEconomy(room: RoomState): void {
  room.combat = {
    ...room.combat,
    paRefreshTurnKey: undefined,
    pendingAutoPass: undefined,
    notices: [],
  };
  grantCombatPaToAllTokens(room);
}

