import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { activeTokenId, type CombatTrack } from "@/lib/room/combat";
import type { RoomActor } from "@/lib/room/types";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";

export type CombatTurnRoom = {
  roomId: string;
  ownerId: string;
  memberIds: string[];
  scene: BattleScene;
  actors: Record<string, RoomActor>;
};

/** Mestre vê todos os PA; jogadores só veem PA de fichas linkadas (nunca monstros). */
export function canViewTokenPa(
  room: CombatTurnRoom,
  user: SessionUser | null,
  token: BattleToken
): boolean {
  if (canManageRoom(room, user)) return true;
  if (token.monsterEntryId && !token.linked) return false;
  if (token.linked && token.actorId) {
    if (room.roomId === "demo") return true;
    if (!user) return false;
    return room.actors[token.actorId]?.ownerId === user.id;
  }
  return false;
}

export function canControlToken(
  room: CombatTurnRoom,
  user: SessionUser | null,
  token: BattleToken
): boolean {
  if (room.roomId === "demo") return true;
  if (!user) return false;
  if (canManageRoom(room, user)) return true;
  if (token.monsterEntryId) return false;
  if (token.linked && token.actorId) {
    return room.actors[token.actorId]?.ownerId === user.id;
  }
  return false;
}

/** Mestre, dono do token na vez, ou qualquer um na mesa demo. */
export function canAdvanceCombatTurn(
  room: CombatTurnRoom,
  user: SessionUser | null,
  combat: CombatTrack
): boolean {
  if (!combat.order.length) return false;
  if (room.roomId === "demo") return true;
  if (!user) return false;
  if (canManageRoom(room, user)) return true;
  const activeId = activeTokenId(combat);
  if (!activeId) return false;
  const token = room.scene.tokens.find((t) => t.id === activeId);
  if (!token) return false;
  return canControlToken(room, user, token);
}
