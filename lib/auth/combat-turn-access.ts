import { canManageRoom, DEMO_PLAYABLE_ACTOR_IDS } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { activeTokenId, type CombatTrack } from "@/lib/room/combat";
import type { RoomActor } from "@/lib/room/types";
import { isMonsterToken } from "@/lib/room/settings";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";

export type CombatTurnRoom = {
  roomId: string;
  ownerId: string;
  memberIds: string[];
  scene: BattleScene;
  actors: Record<string, RoomActor>;
};

/** Mestre vê HP de qualquer criatura; jogadores só veem PCs linkados (e aliados no hover na UI). */
export function canViewTokenHp(
  room: CombatTurnRoom,
  user: SessionUser | null,
  token: BattleToken,
  opts?: { showMonsterHpToPlayers?: boolean }
): boolean {
  if (canManageRoom(room, user)) return true;
  if (token.vidaMax == null) return false;
  if (isMonsterToken(token) && !token.linked) {
    return Boolean(opts?.showMonsterHpToPlayers);
  }
  if (token.linked && !token.monsterEntryId) return true;
  return false;
}

/** Mestre vê todos os PA; jogadores só veem PA de fichas linkadas (nunca monstros). */
export function canViewTokenPa(
  room: CombatTurnRoom,
  user: SessionUser | null,
  token: BattleToken
): boolean {
  if (canManageRoom(room, user)) return true;
  if (isMonsterToken(token) && !token.linked) return false;
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
  if (room.roomId === "demo") {
    if (!user) return false;
    if (canManageRoom(room, user)) return true;
    if (isMonsterToken(token)) return false;
    if (token.linked && token.actorId) {
      return DEMO_PLAYABLE_ACTOR_IDS.includes(
        token.actorId as (typeof DEMO_PLAYABLE_ACTOR_IDS)[number]
      );
    }
    return false;
  }
  if (!user) return false;
  if (canManageRoom(room, user)) return true;
  if (isMonsterToken(token)) return false;
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
  if (!combat.order?.length) return false;
  if (!user) return false;
  if (canManageRoom(room, user)) return true;
  const activeId = activeTokenId(combat);
  if (!activeId) return false;
  const token = room.scene.tokens.find((t) => t.id === activeId);
  if (!token) return false;
  return canControlToken(room, user, token);
}
