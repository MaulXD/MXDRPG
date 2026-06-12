import { hasCondition } from "@/lib/combat/conditions";
import { formatStunSkipNotice } from "@/lib/combat/pa-turn";
import { tickAllTimedEffectsOnNewRound } from "@/lib/combat/timed-effects";
import { isTokenDefeated } from "@/lib/vtt/token-hp-display";
import type { BattleToken } from "@/lib/vtt/types";
import { activeTokenId, nextTurn, type CombatTrack } from "./combat";
import type { RoomState } from "./types";

/** Token derrotado (HP ≤ 0) — fora da ordem até ressuscitar. */
export function isDefeatedToken(token: BattleToken): boolean {
  return isTokenDefeated(token);
}

/** ID do token ativo que pode jogar (ignora mortos/atordoados na fila). */
export function resolveLivingActiveTokenId(
  combat: CombatTrack,
  tokens: BattleToken[]
): string | null {
  const order = combat.order;
  if (!order.length) return null;
  const byId = new Map(tokens.map((t) => [t.id, t]));
  const start = Math.min(Math.max(0, combat.activeIndex), order.length - 1);
  for (let i = 0; i < order.length; i++) {
    const idx = (start + i) % order.length;
    const id = order[idx]!;
    const token = byId.get(id);
    if (token && !shouldAutoSkipTurn(token)) return id;
  }
  return null;
}

/** Recalcula `activeIndex` na ordem viva (sem avançar turno). */
function activeIndexInAliveOrder(
  aliveOrder: string[],
  preferredId: string | null,
  fallbackIndex: number
): number {
  if (!aliveOrder.length) return 0;
  if (preferredId && aliveOrder.includes(preferredId)) {
    return aliveOrder.indexOf(preferredId);
  }
  return Math.min(Math.max(0, fallbackIndex), aliveOrder.length - 1);
}

/** Remove token da iniciativa sem passar turno (Delete no mapa). */
export function removeTokenFromCombatOrder(room: RoomState, removedTokenId: string): void {
  if (!room.combat?.order?.length) return;

  const prevOrder = room.combat.order;
  const prevActiveId = prevOrder[room.combat.activeIndex] ?? null;
  const order = prevOrder.filter((id) => id !== removedTokenId);
  if (!order.length) {
    room.combat = { ...room.combat, order: [], activeIndex: 0 };
    return;
  }

  let activeIndex = room.combat.activeIndex;
  const removedIndex = prevOrder.indexOf(removedTokenId);
  if (removedIndex >= 0 && removedIndex < activeIndex) {
    activeIndex -= 1;
  }
  if (prevActiveId && order.includes(prevActiveId)) {
    activeIndex = order.indexOf(prevActiveId);
  } else {
    activeIndex = Math.min(activeIndex, order.length - 1);
  }

  const byId = new Map(room.scene.tokens.map((t) => [t.id, t]));
  const aliveOrder = order.filter((id) => {
    const t = byId.get(id);
    return t != null && !isDefeatedToken(t);
  });
  if (!aliveOrder.length) {
    room.combat = { ...room.combat, order: [], activeIndex: 0 };
    return;
  }

  room.combat = {
    ...room.combat,
    order: aliveOrder,
    activeIndex: activeIndexInAliveOrder(aliveOrder, prevActiveId, activeIndex),
  };
}

/** Sincroniza ordem de iniciativa com vida dos tokens. */
export function syncCombatOrderWithTokens(room: RoomState): void {
  if (!room.combat?.order?.length) return;

  const byId = new Map(room.scene.tokens.map((t) => [t.id, t]));
  const prevOrder = room.combat.order;
  const prevActiveId = prevOrder[room.combat.activeIndex] ?? null;

  const aliveOrder = prevOrder.filter((id) => {
    const t = byId.get(id);
    return t != null && !isDefeatedToken(t);
  });

  for (const t of room.scene.tokens) {
    if (isDefeatedToken(t)) continue;
    if (!aliveOrder.includes(t.id)) {
      aliveOrder.push(t.id);
    }
  }

  if (!aliveOrder.length) {
    room.combat = { ...room.combat, order: [], activeIndex: 0, notices: room.combat.notices };
    return;
  }

  let activeIndex = 0;
  if (prevActiveId) {
    const idx = aliveOrder.indexOf(prevActiveId);
    if (idx >= 0) {
      activeIndex = idx;
    } else {
      const prevIdx = prevOrder.indexOf(prevActiveId);
      const nextIdx = Math.min(prevIdx >= 0 ? prevIdx : room.combat.activeIndex, aliveOrder.length - 1);
      activeIndex = nextIdx;
    }
  } else {
    activeIndex = Math.min(room.combat.activeIndex, aliveOrder.length - 1);
  }

  room.combat = {
    ...room.combat,
    order: aliveOrder,
    activeIndex,
  };

  skipUnplayableActives(room);
}

/** Pula mortos/atordoados na vez sem avançar turno manualmente. */
export function skipUnplayableActives(room: RoomState): string[] {
  const notices: string[] = [];
  if (!room.combat?.order?.length) return notices;

  const maxSkips = Math.max(1, room.combat.order.length + 1);
  for (let i = 0; i < maxSkips; i++) {
    const active = getActiveBattleToken(room);
    if (!active || !shouldAutoSkipTurn(active)) break;

    if (isDefeatedToken(active)) {
      notices.push(`${active.name} está morto — turno passado.`);
    } else if (hasCondition(active, "atordoado")) {
      notices.push(formatStunSkipNotice(active.name));
    }

    const prevRound = room.combat.round;
    room.combat = nextTurn(room.combat);
    if (room.combat.round > prevRound) {
      const tick = tickAllTimedEffectsOnNewRound(room.scene.tokens);
      room.scene = { ...room.scene, tokens: tick.tokens };
    }

    const byId = new Map(room.scene.tokens.map((t) => [t.id, t]));
    const aliveOrder = room.combat.order.filter((id) => {
      const t = byId.get(id);
      return t != null && !isDefeatedToken(t);
    });
    if (!aliveOrder.length) {
      room.combat = { ...room.combat, order: [], activeIndex: 0 };
      break;
    }
    const steppedId = activeTokenId(room.combat);
    room.combat = {
      ...room.combat,
      order: aliveOrder,
      activeIndex: activeIndexInAliveOrder(
        aliveOrder,
        steppedId,
        room.combat.activeIndex
      ),
    };
  }

  if (notices.length && room.combat) {
    room.combat = {
      ...room.combat,
      notices: [...(room.combat.notices ?? []), ...notices],
    };
  }

  return notices;
}

export function getActiveBattleToken(room: RoomState): BattleToken | null {
  const id = activeTokenId(room.combat);
  if (!id) return null;
  return room.scene.tokens.find((t) => t.id === id) ?? null;
}

export function shouldAutoSkipTurn(token: BattleToken): boolean {
  if (isDefeatedToken(token)) return true;
  if (hasCondition(token, "atordoado")) return true;
  return false;
}
