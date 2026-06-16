/**
 * Motor único da economia de PA na mesa.
 * Regras puras: pa-turn.ts / pa-economy.ts
 * Fase: combat-pa-phase.ts
 */
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
  phaseHasRealPaSpend,
  phaseHasTurnOrder,
  resolveCombatPaPhase,
  type CombatPaPhase,
} from "@/lib/combat/combat-pa-phase";
import { tokenMayActWithZeroSpendablePa } from "@/lib/combat/zero-pa-options";
import { clearPerTurnRecharges } from "@/lib/combat/recharge";
import { resetChiSpentThisTurn } from "@/lib/combat/chi-economy";
import { activeTokenId } from "@/lib/room/combat";
import { isMonsterToken } from "@/lib/room/settings";
import { DEFAULT_AUTO_PASS_DELAY_MS, MIN_AUTO_PASS_DELAY_MS } from "@/lib/room/settings";
import { getActiveBattleToken, shouldAutoSkipTurn } from "@/lib/room/combat-order";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

export type PaRefreshMode = "full" | "regen";

export function combatPaPhase(room: RoomState): CombatPaPhase {
  return resolveCombatPaPhase(room.settings, room.combat);
}

function autoPassDelayMs(room: RoomState): number {
  const raw = room.settings.autoPassDelayMs ?? DEFAULT_AUTO_PASS_DELAY_MS;
  return Math.max(MIN_AUTO_PASS_DELAY_MS, raw);
}

export function paRulesForRoomToken(room: RoomState, token: BattleToken): PaTurnRules {
  if (token.linked && token.actorId && room.actors[token.actorId]) {
    return paTurnRulesForActor(room.actors[token.actorId]);
  }
  return paTurnRulesForMonster(token.monsterTier);
}

// ─── Idempotência de início de turno (`round:tokenId`) ───────────────────────

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

function applyTokenPaRefresh(room: RoomState, tokenIdx: number, mode: PaRefreshMode): void {
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

// ─── Transições de fase (diagrama: exploration ↔ combat) ───────────────────

/** exploration → combat_free: PA cheio para todos no mapa. */
export function onEnterCombatFree(room: RoomState): void {
  room.combat = {
    ...room.combat,
    paRefreshTurnKey: undefined,
    pendingAutoPass: undefined,
    notices: [],
  };
  grantCombatPaToAllTokens(room);
}

/** combat_turn: zera pools antes de conceder PA ao ativo. */
export function resetPoolsForTurnCombat(room: RoomState): void {
  room.combat = {
    ...room.combat,
    paRefreshTurnKey: undefined,
    pendingAutoPass: undefined,
  };
  zeroAllCombatPaPools(room);
}

/** combat → exploration: delegado a exploration-pa.ts no handler de settings. */

// ─── Pool por token ────────────────────────────────────────────────────────

export function grantFullCombatPaToToken(room: RoomState, tokenId: string): void {
  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return;
  applyTokenPaRefresh(room, idx, "full");
}

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

// ─── Ciclo de turno (combat_turn) ──────────────────────────────────────────

export function onTurnStart(
  room: RoomState,
  notices: string[],
  mode: PaRefreshMode = "regen"
): void {
  const activeBefore = getActiveBattleToken(room);
  if (!activeBefore) return;

  const idx = room.scene.tokens.findIndex((t) => t.id === activeBefore.id);
  if (idx < 0) return;

  const carryBefore = Math.max(0, room.scene.tokens[idx]!.pa ?? 0);

  if (!isActiveTurnPaGranted(room)) {
    applyTokenPaRefresh(room, idx, mode);
    markActiveTurnPaGranted(room);
  }

  const active = getActiveBattleToken(room);
  if (!active) return;

  const rules = paRulesForRoomToken(room, active);
  notices.push(
    formatTurnStartCombatNotice(
      active.name,
      room.combat.round,
      active.pa ?? 0,
      rules,
      mode === "full" ? 0 : carryBefore
    )
  );
}

export function onTurnEnd(room: RoomState, notices: string[]): void {
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

export function tokenNeedsTurnStartPaRefresh(token: BattleToken): boolean {
  if (tokenSpendablePa(token) > 0) return false;
  if (tokenPaSpentThisTurn(token) > 0) return false;
  return true;
}

/** Antes de validar gasto — garante pool se a fase exige PA real. */
export function ensureSpendableBeforeAction(
  room: RoomState,
  tokenId: string,
  opts?: { bypassTurn?: boolean }
): BattleToken | null {
  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return null;

  const token = room.scene.tokens[idx]!;
  const phase = combatPaPhase(room);

  if (!phaseHasRealPaSpend(phase)) return token;

  const spendable = tokenSpendablePa(token);
  const spent = tokenPaSpentThisTurn(token);
  if (spendable > 0 || spent > 0) return token;

  if (phaseHasTurnOrder(phase)) {
    const activeId = activeTokenId(room.combat);
    if (!opts?.bypassTurn && token.id !== activeId) return token;
  }

  if (!tokenNeedsTurnStartPaRefresh(token)) return token;

  applyTokenPaRefresh(room, idx, phaseHasTurnOrder(phase) ? "regen" : "full");
  if (phaseHasTurnOrder(phase)) markActiveTurnPaGranted(room);
  return room.scene.tokens[idx] ?? null;
}

export function onTokenSpawned(room: RoomState, tokenId: string): void {
  const phase = combatPaPhase(room);
  if (!phaseHasRealPaSpend(phase)) return;

  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return;

  if (phaseHasTurnOrder(phase)) {
    const cleared = clearCombatPaPool(room.scene.tokens[idx]!);
    const tokens = [...room.scene.tokens];
    tokens[idx] = cleared;
    room.scene = { ...room.scene, tokens };
    syncActorPaFromToken(room, cleared);
    return;
  }

  grantFullCombatPaToToken(room, tokenId);
}

// ─── Auto-passe (só combat_turn) ───────────────────────────────────────────

export function clearPendingAutoPass(room: RoomState): void {
  if (!room.combat?.pendingAutoPass) return;
  room.combat = { ...room.combat, pendingAutoPass: undefined };
}

export function shouldScheduleAutoPass(room: RoomState, token: BattleToken): boolean {
  if (tokenSpendablePa(token) > 0) return false;
  if (tokenMayActWithZeroSpendablePa(room, token)) return false;
  return tokenPaSpentThisTurn(token) > 0;
}

export function scheduleAutoPassIfNeeded(room: RoomState): boolean {
  if (combatPaPhase(room) !== "combat_turn") {
    clearPendingAutoPass(room);
    return false;
  }

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

export function shouldExecuteAutoPass(
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

// ─── Reparo de estado legado (DB / bug antigo) ─────────────────────────────

export function repairStaleCombatPa(room: RoomState): boolean {
  if (combatPaPhase(room) !== "combat_turn") return false;
  if (room.combat.pendingAutoPass) return false;

  const active = getActiveBattleToken(room);
  if (!active || shouldAutoSkipTurn(active)) return false;

  const idx = room.scene.tokens.findIndex((t) => t.id === active.id);
  if (idx < 0) return false;

  const token = room.scene.tokens[idx]!;
  const spendable = tokenSpendablePa(token);
  const spent = tokenPaSpentThisTurn(token);

  if (spent > 0 && spendable === 0) return false;

  const staleGrant = isActiveTurnPaGranted(room) && spendable === 0 && spent === 0;
  const needsGrant = !isActiveTurnPaGranted(room) && spendable === 0 && spent === 0;
  if (!staleGrant && !needsGrant) return false;

  if (staleGrant) clearActiveTurnPaGrant(room);
  applyTokenPaRefresh(room, idx, "regen");
  markActiveTurnPaGranted(room);
  return true;
}

// ─── Aliases (migração gradual) ────────────────────────────────────────────

export const enterCombatPaEconomy = onEnterCombatFree;
export const pushTurnStartNotice = onTurnStart;
export const bankActiveTokenPa = onTurnEnd;
export const applyCombatSpendablePaIfDue = ensureSpendableBeforeAction;
export const prepareSpawnedTokenPa = onTokenSpawned;
export const scheduleAutoPassWhenActivePaZero = scheduleAutoPassIfNeeded;
export const executePendingAutoPassIfDue = shouldExecuteAutoPass;

export function refreshActiveTokenAtTurnStart(
  room: RoomState,
  mode: PaRefreshMode = "regen"
): { refreshed: boolean; carryBefore: number } {
  const active = getActiveBattleToken(room);
  if (!active) return { refreshed: false, carryBefore: 0 };
  const idx = room.scene.tokens.findIndex((t) => t.id === active.id);
  if (idx < 0) return { refreshed: false, carryBefore: 0 };
  const carryBefore = Math.max(0, room.scene.tokens[idx]!.pa ?? 0);
  if (isActiveTurnPaGranted(room)) return { refreshed: false, carryBefore };
  applyTokenPaRefresh(room, idx, mode);
  markActiveTurnPaGranted(room);
  return { refreshed: true, carryBefore };
}
