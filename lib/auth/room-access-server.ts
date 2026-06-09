import "server-only";

import { getAdventure } from "@/lib/adventure/store";
import * as dbAdventures from "@/lib/db/adventures";
import { dbEnabled } from "@/lib/db/enabled";
import { fetchClerkIdForUser } from "@/lib/db/users";
import {
  canViewRoom,
  inviteMatches,
  isRoomMember,
  normalizeInviteCode,
} from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomState } from "@/lib/room/types";

/** Convite válido para a mesa (código da sala ou da aventura vinculada). */
export async function inviteMatchesRoom(
  room: RoomState,
  code: string | null | undefined
): Promise<boolean> {
  if (!code?.trim()) return false;
  if (inviteMatches(room, code)) return true;

  const normalized = normalizeInviteCode(code);
  const adventureId = room.adventureId ?? room.roomId;
  const adv = await getAdventure(adventureId);
  if (
    adv &&
    normalizeInviteCode(adv.inviteCode) === normalized &&
    (adv.primaryRoomId === room.roomId || adv.adventureId === adventureId)
  ) {
    return true;
  }

  if (dbEnabled()) {
    const byInvite = await dbAdventures.fetchAdventureByInvite(normalized);
    if (!byInvite) return false;
    if (byInvite.primaryRoomId === room.roomId) return true;
    if (room.adventureId === byInvite.adventureId || adventureId === byInvite.adventureId) {
      return true;
    }
  }

  return false;
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
  if (canViewRoom(room, user, inviteCode)) return true;
  if (user && (await isRoomMemberResolved(room, user.id, user.clerkId))) return true;
  if (inviteCode && (await inviteMatchesRoom(room, inviteCode))) return true;
  return false;
}
