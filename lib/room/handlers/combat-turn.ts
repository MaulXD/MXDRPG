import {
  paMaxForActor,
  paTurnRulesForActor,
  paTurnRulesForMonster,
} from "@/lib/combat/pa-economy";
import { normalizeTokenPaFields } from "@/lib/combat/pa-token-state";
import {
  bankPaAtEndOfTurn,
  refreshPaAtTurnStart,
  startTurnPaFull,
} from "@/lib/combat/pa-turn";
import type { BattleToken } from "@/lib/vtt/types";
import { activeTokenId, nextTurn, rollInitiative } from "../combat";
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

/** Garante PA do token ativo na iniciativa (demo / sala nova). */
export function initCombatPaForRoom(room: RoomState): void {
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
  tokens[idx] = {
    ...token,
    ...normalizeTokenPaFields(refreshed, paMax),
  };

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

function applyTurnPaTransition(room: RoomState): void {
  const endingId = activeTokenId(room.combat);
  if (endingId) {
    const idx = room.scene.tokens.findIndex((t) => t.id === endingId);
    if (idx >= 0) {
      const tokens = [...room.scene.tokens];
      const before = tokens[idx];
      const rules = paRulesForToken(room, before);
      const paMax = rules.recoveryPerTurn;
      const ended = {
        ...before,
        ...normalizeTokenPaFields(bankPaAtEndOfTurn(before, rules), paMax),
      };
      tokens[idx] = ended;
      room.scene = { ...room.scene, tokens };
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
  }

  room.combat = nextTurn(room.combat);
  resetAllTokenMovement(room);
  refreshActiveTokenPa(room);
}

export async function rollRoomInitiative(roomId: string): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const { order, scores } = rollInitiative(room);
  room.combat = { order, activeIndex: 0, round: 1 };
  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => ({
      ...t,
      initiative: scores[t.id] ?? t.initiative,
    })),
  };
  resetAllTokenMovement(room);
  refreshActiveTokenPa(room, "full");

  return toSnapshot(await persistRoom(roomId, room));
}

export async function advanceRoomTurn(roomId: string): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  applyTurnPaTransition(room);

  return toSnapshot(await persistRoom(roomId, room));
}

export async function setRoomCombatOrder(
  roomId: string,
  order: string[]
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const ids = new Set(room.scene.tokens.map((t) => t.id));
  const valid = order.filter((id) => ids.has(id));
  for (const t of room.scene.tokens) {
    if (!valid.includes(t.id)) valid.push(t.id);
  }

  room.combat = {
    ...room.combat,
    order: valid,
    activeIndex: Math.min(room.combat.activeIndex, Math.max(0, valid.length - 1)),
  };

  return toSnapshot(await persistRoom(roomId, room));
}
