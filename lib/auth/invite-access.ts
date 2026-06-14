import "server-only";

import { inviteBelongsToRoom } from "@/lib/auth/mesa-invite";
import { isRoomMember } from "@/lib/auth/room-access";
import { joinRoomByInvite, getRoom } from "@/lib/room/store";
import type { RoomState } from "@/lib/room/types";

export async function adventureInviteForRoom(room: RoomState): Promise<string | null> {
  const { canonicalInviteForRoom } = await import("@/lib/auth/mesa-invite");
  const canonical = await canonicalInviteForRoom(room);
  return canonical.inviteCode;
}

export async function inviteValidForRoom(
  room: RoomState,
  code: string | null | undefined
): Promise<boolean> {
  return inviteBelongsToRoom(room, code);
}

export async function tryJoinRoomWithInvite(
  room: RoomState,
  userId: string,
  inviteCode: string | null | undefined,
  clerkId?: string | null
): Promise<RoomState | null> {
  if (!inviteCode?.trim() || !userId) return null;
  if (isRoomMember(room, userId, clerkId)) return room;
  if (!(await inviteBelongsToRoom(room, inviteCode))) return null;
  const joined = await joinRoomByInvite(inviteCode.trim(), userId, room.roomId);
  if (!joined) return null;
  return (await getRoom(room.roomId)) ?? joined;
}
