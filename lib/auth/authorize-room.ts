import { canControlToken, canAdvanceCombatTurn } from "@/lib/auth/combat-turn-access";
import { getRoom } from "@/lib/room/store";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";
import { canAccessRoom, canManageRoom, canSpawnMonstersInRoom } from "@/lib/auth/room-access";

export { canControlToken, canAdvanceCombatTurn } from "@/lib/auth/combat-turn-access";
import { getSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

export type RoomAuthOk = { room: RoomState; user: SessionUser };
export type RoomAuthFail = { status: number; error: string };

export async function requireRoomManage(roomId: string): Promise<RoomAuthOk | RoomAuthFail> {
  const session = await getSession();
  if (!session) return { status: 401, error: "Faça login" };
  const user = session.user;

  const room = await getRoom(roomId);
  if (!room) return { status: 404, error: "Sala não encontrada" };

  if (!canManageRoom(room, user)) {
    return { status: 403, error: "Só o dono desta mesa pode fazer isso" };
  }

  return { room, user };
}

/** Invocar monstros na mesa (demo: visitante; salas: mestre/admin). */
export type RoomSpawnAuthOk = { room: RoomState; user: SessionUser | null };

export async function requireRoomSpawn(
  roomId: string
): Promise<RoomSpawnAuthOk | RoomAuthFail> {
  const session = await getSession();
  const room = await getRoom(roomId);
  if (!room) return { status: 404, error: "Sala não encontrada" };

  if (!canSpawnMonstersInRoom(room, session?.user ?? null)) {
    return { status: 403, error: "Sem permissão para invocar monstros nesta mesa" };
  }

  return { room, user: session?.user ?? null };
}

export async function requireRoomMember(roomId: string): Promise<RoomAuthOk | RoomAuthFail> {
  const session = await getSession();
  if (!session) return { status: 401, error: "Faça login" };

  const room = await getRoom(roomId);
  if (!room) return { status: 404, error: "Sala não encontrada" };

  if (!canAccessRoom(room, session.user)) {
    return { status: 403, error: "Você não participa desta mesa" };
  }

  return { room, user: session.user };
}

export function canMoveToken(room: RoomState, user: SessionUser, token: BattleToken): boolean {
  return canControlToken(room, user, token);
}

export type TokenControlFail = { status: number; error: string };

export function assertTokenControl(
  room: RoomState,
  user: SessionUser | null,
  token: BattleToken | undefined
): TokenControlFail | null {
  if (!token) return { status: 404, error: "Token não encontrado" };
  if (room.roomId === "demo") return null;
  if (!user) return { status: 401, error: "Faça login" };
  if (!canAccessRoom(room, user)) return { status: 403, error: "Você não participa desta mesa" };
  if (!canControlToken(room, user, token)) {
    return { status: 403, error: "Sem permissão neste token" };
  }
  return null;
}

export function chatRoleForUser(room: RoomState, user: SessionUser): "mestre" | "jogador" {
  return canManageRoom(room, user) ? "mestre" : "jogador";
}
