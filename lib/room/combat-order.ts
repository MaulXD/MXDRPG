import { hasCondition } from "@/lib/combat/conditions";
import { formatStunSkipNotice } from "@/lib/combat/pa-turn";
import { isTokenDefeated } from "@/lib/vtt/token-hp-display";
import type { BattleToken } from "@/lib/vtt/types";
import { activeTokenId, type CombatTrack } from "./combat";
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

function buildAliveCombatOrder(room: RoomState): string[] {
  const byId = new Map(room.scene.tokens.map((t) => [t.id, t]));
  const prevOrder = room.combat.order;

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

  return aliveOrder;
}

/** Atualiza a fila viva sem desfazer o avanço de turno — mantém o token ativo por ID. */
export function reconcileCombatOrderPreservingActive(room: RoomState): void {
  if (!room.combat?.order?.length) return;

  const preferredActiveId = activeTokenId(room.combat);
  const aliveOrder = buildAliveCombatOrder(room);

  if (!aliveOrder.length) {
    room.combat = { ...room.combat, order: [], activeIndex: 0, notices: room.combat.notices };
    return;
  }

  room.combat = {
    ...room.combat,
    order: aliveOrder,
    activeIndex: activeIndexInAliveOrder(
      aliveOrder,
      preferredActiveId,
      room.combat.activeIndex
    ),
  };
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
  if (prevActiveId === removedTokenId) {
    activeIndex = removedIndex >= order.length ? 0 : removedIndex;
  } else if (removedIndex >= 0 && removedIndex < activeIndex) {
    activeIndex -= 1;
  } else if (prevActiveId && order.includes(prevActiveId)) {
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

  const prevOrder = room.combat.order;
  const prevActiveId = prevOrder[room.combat.activeIndex] ?? null;
  const aliveOrder = buildAliveCombatOrder(room);

  if (!aliveOrder.length) {
    room.combat = { ...room.combat, order: [], activeIndex: 0, notices: room.combat.notices };
    return;
  }

  const activeIndex = activeIndexInAliveOrder(
    aliveOrder,
    prevActiveId,
    room.combat.activeIndex
  );

  room.combat = {
    ...room.combat,
    order: aliveOrder,
    activeIndex,
  };

  skipUnplayableActives(room);
}

/** Pula mortos/atordoados na fila sem avançar rodada nem tickar efeitos (só reindexa). */
export function skipUnplayableActives(room: RoomState): string[] {
  const notices: string[] = [];
  if (!room.combat?.order?.length) return notices;

  const order = room.combat.order;
  const byId = new Map(room.scene.tokens.map((t) => [t.id, t]));
  const startIdx = room.combat.activeIndex;

  for (let step = 0; step < order.length; step++) {
    const idx = (startIdx + step) % order.length;
    const active = byId.get(order[idx]!);
    if (!active) continue;
    if (!shouldAutoSkipTurn(active)) {
      if (idx !== startIdx) {
        room.combat = { ...room.combat, activeIndex: idx };
      }
      break;
    }

    if (isDefeatedToken(active)) {
      notices.push(`${active.name} está morto — turno passado.`);
    } else if (hasCondition(active, "atordoado")) {
      notices.push(formatStunSkipNotice(active.name));
    }

    if (step === order.length - 1) {
      const aliveOrder = order.filter((id) => {
        const t = byId.get(id);
        return t != null && !isDefeatedToken(t);
      });
      if (!aliveOrder.length) {
        room.combat = { ...room.combat, order: [], activeIndex: 0 };
      }
    }
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
