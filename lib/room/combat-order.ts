import { hasCondition } from "@/lib/combat/conditions";
import type { BattleToken } from "@/lib/vtt/types";
import type { RoomState } from "./types";
import { activeTokenId } from "./combat";

/** Token derrotado (HP ≤ 0) — fora da ordem até ressuscitar. */
export function isDefeatedToken(token: BattleToken): boolean {
  if (token.vidaMax == null) return false;
  return (token.vida ?? 0) <= 0;
}

/** Sincroniza ordem de iniciativa com vida dos tokens. */
export function syncCombatOrderWithTokens(room: RoomState): void {
  if (!room.combat?.order?.length) return;

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

  if (!aliveOrder.length) {
    room.combat = { ...room.combat, order: [], activeIndex: 0 };
    return;
  }

  const prevActiveId = prevOrder[room.combat.activeIndex] ?? null;
  let activeIndex = 0;
  if (prevActiveId) {
    const idx = aliveOrder.indexOf(prevActiveId);
    activeIndex =
      idx >= 0 ? idx : Math.min(room.combat.activeIndex, aliveOrder.length - 1);
  } else {
    activeIndex = Math.min(room.combat.activeIndex, aliveOrder.length - 1);
  }

  room.combat = {
    ...room.combat,
    order: aliveOrder,
    activeIndex,
  };
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
