import "server-only";

import { getAdventure } from "@/lib/adventure/store";
import { isAdventureClosed } from "@/lib/adventure/access";
import { isHomologPublicRoom } from "@/lib/env/homolog";
import { fetchClerkIdForUser } from "@/lib/db/users";
import {
  canViewRoom,
  isRoomMember,
} from "@/lib/auth/room-access";
import { inviteBelongsToRoom } from "@/lib/auth/mesa-invite";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomState } from "@/lib/room/types";

/** Convite válido para a mesa (código da sala ou da aventura vinculada). */
export async function inviteMatchesRoom(
  room: RoomState,
  code: string | null | undefined
): Promise<boolean> {
  return inviteBelongsToRoom(room, code);
}

/** Reconhece membership gravada com id efêmero `clerk-*` antes do sync Postgres. */
export async function isRoomMemberResolved(
  room: Pick<RoomState, "roomId"> & { ownerId?: string; memberIds?: string[] },
  userId: string | undefined,
  clerkId?: string | null
): Promise<boolean> {
  if (isRoomMember(room, userId, clerkId)) return true;
  if (!userId?.startsWith("usr_")) return false;

  const resolvedClerkId = clerkId ?? (await fetchClerkIdForUser(userId));
  if (!resolvedClerkId) return false;
  return (room.memberIds ?? []).includes(`clerk-${resolvedClerkId}`);
}

export async function canViewRoomServer(
  room: RoomState,
  user: SessionUser | null | undefined,
  inviteCode?: string | null
): Promise<boolean> {
  if (room.roomId === "demo") return true;
  if (isHomologPublicRoom(room.roomId)) return true;
  if (user?.role === "admin") return true;

  if (user && (await isRoomMemberResolved(room, user.id, user.clerkId))) return true;
  if (inviteCode && (await inviteMatchesRoom(room, inviteCode))) return true;

  const adventureId = room.adventureId ?? room.roomId;
  const adv = await getAdventure(adventureId);
  if (adv && isAdventureClosed(adv)) return false;

  if (canViewRoom(room, user, inviteCode)) return true;
  return false;
}
