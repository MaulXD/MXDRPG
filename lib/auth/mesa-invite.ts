import "server-only";

import { getAdventure } from "@/lib/adventure/store";
import { isAdventureJoinable } from "@/lib/adventure/lifecycle";
import * as dbAdventures from "@/lib/db/adventures";
import * as dbRooms from "@/lib/db/rooms";
import { dbEnabled } from "@/lib/db/enabled";
import { normalizeInviteCode } from "@/lib/auth/room-access";
import { getRoom } from "@/lib/room/store";
import type { Adventure } from "@/lib/adventure/types";
import type { RoomState } from "@/lib/room/types";

export type CanonicalMesaInvite = {
  adventureId: string;
  roomId: string;
  inviteCode: string;
};

/** Fonte de verdade do convite: aventura → sala primária. */
export async function canonicalInviteForRoom(room: RoomState): Promise<CanonicalMesaInvite> {
  const adventureId = room.adventureId ?? room.roomId;
  const adv = await getAdventure(adventureId);
  if (adv && !adv.deletedAt) {
    return {
      adventureId: adv.adventureId,
      roomId: adv.primaryRoomId,
      inviteCode: adv.inviteCode,
    };
  }
  return {
    adventureId,
    roomId: room.roomId,
    inviteCode: room.inviteCode,
  };
}

/** O código pertence a esta mesa (não a outra com o mesmo código legado). */
export async function inviteBelongsToRoom(
  room: RoomState,
  code: string | null | undefined
): Promise<boolean> {
  const norm = normalizeInviteCode(code ?? "");
  if (!norm) return false;

  const canonical = await canonicalInviteForRoom(room);
  if (normalizeInviteCode(canonical.inviteCode) === norm) {
    return room.roomId === canonical.roomId;
  }
  if (normalizeInviteCode(room.inviteCode) === norm) {
    return true;
  }

  if (dbEnabled()) {
    const byRoom = await dbRooms.fetchRoomByInvite(norm);
    if (byRoom) return byRoom.roomId === room.roomId;
  }

  return false;
}

export async function resolveMesaByInviteCode(
  inviteCode: string
): Promise<{ room: RoomState; adventure: Adventure | null } | null> {
  const code = normalizeInviteCode(inviteCode);
  if (!code) return null;

  if (dbEnabled()) {
    const adv = await dbAdventures.fetchAdventureByInvite(code);
    if (adv && isAdventureJoinable(adv)) {
      const room = await getRoom(adv.primaryRoomId);
      if (room) return { room, adventure: adv };
    }
    const fromRoom = await dbRooms.fetchRoomByInvite(code);
    if (fromRoom) {
      const advId = fromRoom.adventureId ?? fromRoom.roomId;
      const adventure = await getAdventure(advId);
      if (adventure?.deletedAt) return null;
      return { room: fromRoom, adventure: adventure ?? null };
    }
  }

  const { listCachedAdventures } = await import("@/lib/adventure/store");
  for (const adv of listCachedAdventures()) {
    if (adv.inviteCode.toUpperCase() !== code) continue;
    if (!isAdventureJoinable(adv)) return null;
    const room = await getRoom(adv.primaryRoomId);
    if (room) return { room, adventure: adv };
  }

  const { rooms } = await import("@/lib/room/internal/registry");
  for (const room of rooms().values()) {
    if (room.inviteCode.toUpperCase() !== code) continue;
    const advId = room.adventureId ?? room.roomId;
    const adventure = await getAdventure(advId);
    if (adventure?.deletedAt) return null;
    return { room, adventure: adventure ?? null };
  }

  return null;
}
