import {
  paTurnRulesForActor,
  paTurnRulesForMonster,
} from "@/lib/combat/pa-economy";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import { startTurnPaFull } from "@/lib/combat/pa-turn";
import { resetTokenMovement } from "@/lib/vtt/movement";
import type { BattleToken } from "@/lib/vtt/types";
import type { CombatTrack } from "./combat";
import { isDefeatedToken } from "./combat-order";
import type { RoomState } from "./types";

function paRulesForToken(room: RoomState, token: BattleToken) {
  if (token.linked && token.actorId && room.actors[token.actorId]) {
    return paTurnRulesForActor(room.actors[token.actorId]);
  }
  return paTurnRulesForMonster(token.monsterTier);
}

/** Aplica ordem manual do mestre preservando o token ativo e a ordem natural. */
export function applyGmCombatOrder(
  combat: CombatTrack,
  room: RoomState,
  newOrder: string[],
  opts?: { activeTokenId?: string }
): CombatTrack {
  const byId = new Map(room.scene.tokens.map((t) => [t.id, t]));

  const filtered = newOrder.filter((id) => {
    const t = byId.get(id);
    return t != null && !isDefeatedToken(t);
  });

  for (const t of room.scene.tokens) {
    if (isDefeatedToken(t)) continue;
    if (!filtered.includes(t.id)) filtered.push(t.id);
  }

  const naturalOrder = combat.naturalOrder ?? [...combat.order];
  const activeId =
    opts?.activeTokenId?.trim() ||
    combat.order[combat.activeIndex] ||
    null;

  let activeIndex = 0;
  if (activeId) {
    const idx = filtered.indexOf(activeId);
    activeIndex = idx >= 0 ? idx : 0;
  }

  return {
    ...combat,
    order: filtered,
    activeIndex,
    naturalOrder,
    orderOverridden: true,
  };
}

/** Move token para o fim da ordem (jogada extra nesta rodada). */
export function deferTokenToEndOfOrder(combat: CombatTrack, tokenId: string): CombatTrack {
  const order = [...combat.order];
  const idx = order.indexOf(tokenId);
  if (idx < 0) return combat;

  const naturalOrder = combat.naturalOrder ?? [...combat.order];
  order.splice(idx, 1);
  order.push(tokenId);

  let activeIndex = combat.activeIndex;
  if (idx < activeIndex) {
    activeIndex -= 1;
  } else if (idx === activeIndex) {
    activeIndex = Math.min(activeIndex, Math.max(0, order.length - 1));
  }

  return {
    ...combat,
    order,
    activeIndex,
    naturalOrder,
    orderOverridden: true,
  };
}

export function restoreNaturalCombatOrder(room: RoomState): boolean {
  const natural = room.combat.naturalOrder;
  if (!natural?.length) return false;

  const byId = new Map(room.scene.tokens.map((t) => [t.id, t]));
  const order = natural.filter((id) => {
    const t = byId.get(id);
    return t != null && !isDefeatedToken(t);
  });

  for (const t of room.scene.tokens) {
    if (isDefeatedToken(t)) continue;
    if (!order.includes(t.id)) order.push(t.id);
  }

  const activeId = room.combat.order[room.combat.activeIndex];
  let activeIndex = activeId ? order.indexOf(activeId) : 0;
  if (activeIndex < 0) activeIndex = 0;

  room.combat = {
    ...room.combat,
    order,
    activeIndex,
    orderOverridden: false,
  };
  return true;
}

export function gmResetTokenPaInRoom(room: RoomState, tokenId: string): BattleToken | null {
  const idx = room.scene.tokens.findIndex((t) => t.id === tokenId);
  if (idx < 0) return null;

  const token = room.scene.tokens[idx]!;
  const rules = paRulesForToken(room, token);
  const paMax = rules.recoveryPerTurn;
  const base = startTurnPaFull(resetTokenMovement(token), rules);
  const refreshed: BattleToken = {
    ...token,
    ...base,
    ...normalizeTokenPaFields(base, paMax),
  };

  const tokens = [...room.scene.tokens];
  tokens[idx] = refreshed;
  room.scene = { ...room.scene, tokens };

  if (refreshed.linked && refreshed.actorId && room.actors[refreshed.actorId]) {
    const a = room.actors[refreshed.actorId];
    room.actors[refreshed.actorId] = {
      ...a,
      resources: {
        ...a.resources,
        pontosAcao: { value: refreshed.pa, max: paMax },
      },
      revision: a.revision + 1,
    };
  }

  return refreshed;
}
