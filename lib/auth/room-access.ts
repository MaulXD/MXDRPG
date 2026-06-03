import type { SessionUser } from "@/lib/auth/types";
import type { RoomState } from "@/lib/room/types";

/** Criador da mesa = “mestre” só nesta sala (modelo Roll20) */
export function isRoomOwner(room: RoomState, userId: string | undefined): boolean {
  if (!userId) return false;
  return room.ownerId === userId;
}

export function isRoomMember(room: RoomState, userId: string | undefined): boolean {
  if (!userId) return false;
  if (isRoomOwner(room, userId)) return true;
  return room.memberIds.includes(userId);
}

export function canManageRoom(
  room: RoomState,
  user: SessionUser | null | undefined
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return isRoomOwner(room, user.id);
}

export function canAccessRoom(
  room: RoomState,
  user: SessionUser | null | undefined
): boolean {
  if (room.roomId === "demo") return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  return isRoomMember(room, user.id);
}

export function canViewMonsterCompendium(
  room: RoomState,
  user: SessionUser | null | undefined
): boolean {
  return canManageRoom(room, user);
}
