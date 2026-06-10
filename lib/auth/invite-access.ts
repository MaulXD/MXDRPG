import "server-only";

import * as dbAdventures from "@/lib/db/adventures";
import { getAdventure } from "@/lib/adventure/store";
import { isRoomMember, inviteMatches, normalizeInviteCode } from "@/lib/auth/room-access";
import { dbEnabled } from "@/lib/db/enabled";
import { joinRoomByInvite, getRoom } from "@/lib/room/store";
import type { RoomState } from "@/lib/room/types";

export async function adventureInviteForRoom(room: RoomState): Promise<string | null> {
  const advId = room.adventureId ?? room.roomId;
  const adventure = await getAdventure(advId);
  return adventure?.inviteCode ?? null;
}

export async function inviteValidForRoom(
  room: RoomState,
  code: string | null | undefined
): Promise<boolean> {
  if (!code?.trim()) return false;
  if (inviteMatches(room, code)) return true;
  const advInvite = await adventureInviteForRoom(room);
  if (inviteMatches(room, code, advInvite)) return true;

  if (dbEnabled()) {
    const byInvite = await dbAdventures.fetchAdventureByInvite(normalizeInviteCode(code));
    if (!byInvite) return false;
    if (byInvite.primaryRoomId === room.roomId) return true;
    const advId = room.adventureId ?? room.roomId;
    if (byInvite.adventureId === advId) return true;
  }

  return false;
}

export async function tryJoinRoomWithInvite(
  room: RoomState,
  userId: string,
  inviteCode: string | null | undefined,
  clerkId?: string | null
): Promise<RoomState | null> {
  if (!inviteCode?.trim() || !userId) return null;
  if (isRoomMember(room, userId, clerkId)) return room;
  if (!(await inviteValidForRoom(room, inviteCode))) return null;
  const joined = await joinRoomByInvite(inviteCode.trim(), userId);
  if (!joined) return null;
  return (await getRoom(room.roomId)) ?? joined;
}
