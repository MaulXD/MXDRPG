import { createAdventure } from "@/lib/adventure/store";
import { syncAdventureActorsForRoom } from "@/lib/room/adventure-actors";
import { joinRoomMembers } from "@/lib/room/adventure-room";
import { inviteBelongsToRoom, resolveMesaByInviteCode } from "@/lib/auth/mesa-invite";
import { normalizeInviteCode } from "@/lib/auth/room-access";
import * as dbRooms from "@/lib/db/rooms";
import { getRoom, rooms, toSnapshot } from "../internal/registry";
import type { RoomListItem, RoomSnapshot, RoomState } from "../types";

export async function getRoomSnapshot(
  roomId: string,
  opts?: { room?: RoomState }
): Promise<RoomSnapshot | null> {
  const room = opts?.room ?? (await getRoom(roomId));
  if (!room) return null;
  return toSnapshot(room);
}

/** Cria aventura + mesa (1:1). Preferir `createAdventure` na API. */
export async function createRoom(ownerId: string, name: string): Promise<RoomState> {
  const created = await createAdventure(ownerId, name);
  if (!created.ok) throw new Error(created.error);
  const room = await getRoom(created.adventure.primaryRoomId);
  if (!room) throw new Error("Falha ao criar mesa da aventura");
  return room;
}

async function joinRoomForTarget(room: RoomState, userId: string): Promise<RoomState | null> {
  const advId = room.adventureId ?? room.roomId;
  const { getAdventure, joinAdventureRecord } = await import("@/lib/adventure/store");
  const adv = await getAdventure(advId);
  if (adv && !adv.deletedAt) {
    await joinAdventureRecord(adv, userId);
  } else {
    await joinRoomMembers(room.roomId, userId);
  }
  const fresh = await getRoom(room.roomId);
  if (!fresh) return null;
  return syncAdventureActorsForRoom(fresh.roomId);
}

export async function joinRoomByInvite(
  inviteCode: string,
  userId: string,
  targetRoomId?: string | null
): Promise<RoomState | null> {
  const code = normalizeInviteCode(inviteCode);
  if (!code) return null;

  const targetId = targetRoomId?.trim() || null;
  if (targetId) {
    const target = await getRoom(targetId);
    if (!target || !(await inviteBelongsToRoom(target, code))) return null;
    return joinRoomForTarget(target, userId);
  }

  const resolved = await resolveMesaByInviteCode(code);
  if (resolved) return joinRoomForTarget(resolved.room, userId);

  return joinRoomByInviteLegacy(code, userId);
}

/** Entrada por convite só na tabela de salas (legado). */
export async function joinRoomByInviteLegacy(
  inviteCode: string,
  userId: string
): Promise<RoomState | null> {
  const code = inviteCode.trim().toUpperCase();

  if (dbRooms.dbEnabled()) {
    const fromDb = await dbRooms.fetchRoomByInvite(code);
    if (fromDb) {
      return joinRoomForTarget(fromDb, userId);
    }
  }

  for (const room of rooms().values()) {
    if (room.inviteCode.toUpperCase() !== code) continue;
    return joinRoomForTarget(room, userId);
  }
  return null;
}

export async function listRoomsForUser(userId: string): Promise<RoomListItem[]> {
  if (dbRooms.dbEnabled()) {
    const fromDb = await dbRooms.listRoomsForOwnerOrMember(userId);
    if (fromDb.length > 0) return fromDb;
  }

  const out: RoomListItem[] = [];
  for (const room of rooms().values()) {
    if (room.ownerId === userId || room.memberIds.includes(userId)) {
      out.push({
        roomId: room.roomId,
        adventureId: room.adventureId ?? room.roomId,
        name: room.name,
        ownerId: room.ownerId,
        inviteCode: room.inviteCode,
        isOwner: room.ownerId === userId,
        updatedAt: room.updatedAt,
      });
    }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getRoomMeta(roomId: string): Promise<Pick<
  RoomState,
  "roomId" | "ownerId" | "name" | "inviteCode" | "memberIds"
> | null> {
  const room = await getRoom(roomId);
  if (!room) return null;
  return {
    roomId: room.roomId,
    ownerId: room.ownerId,
    name: room.name,
    inviteCode: room.inviteCode,
    memberIds: room.memberIds,
  };
}

export async function getRoomActor(
  roomId: string,
  actorId: string,
  opts?: { room?: RoomState }
) {
  const room = opts?.room ?? (await getRoom(roomId));
  return room?.actors[actorId] ?? null;
}
