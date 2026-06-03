import { getRoom } from "@/lib/room/store";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";
import { canAccessRoom, canManageRoom } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

export type RoomAuthOk = { room: RoomState; user: SessionUser };
export type RoomAuthFail = { status: number; error: string };

export async function requireRoomManage(roomId: string): Promise<RoomAuthOk | RoomAuthFail> {
  const session = await getSession();
  if (!session) return { status: 401, error: "Faça login" };
  const user = session.user;

  const room = getRoom(roomId);
  if (!room) return { status: 404, error: "Sala não encontrada" };

  if (!canManageRoom(room, user)) {
    return { status: 403, error: "Só o dono desta mesa pode fazer isso" };
  }

  return { room, user };
}

export async function requireRoomMember(roomId: string): Promise<RoomAuthOk | RoomAuthFail> {
  const session = await getSession();
  if (!session) return { status: 401, error: "Faça login" };

  const room = getRoom(roomId);
  if (!room) return { status: 404, error: "Sala não encontrada" };

  if (!canAccessRoom(room, session.user)) {
    return { status: 403, error: "Você não participa desta mesa" };
  }

  return { room, user: session.user };
}

export function canMoveToken(room: RoomState, user: SessionUser, token: BattleToken): boolean {
  if (canManageRoom(room, user)) return true;
  if (token.linked && token.actorId) {
    const actor = room.actors[token.actorId];
    return actor?.ownerId === user.id;
  }
  return false;
}

export function chatRoleForUser(room: RoomState, user: SessionUser): "mestre" | "jogador" {
  return canManageRoom(room, user) ? "mestre" : "jogador";
}
