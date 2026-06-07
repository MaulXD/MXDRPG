import { createAdventure } from "@/lib/adventure/store";
import { syncAdventureActorsForRoom } from "@/lib/room/adventure-actors";
import * as dbRooms from "@/lib/db/rooms";
import { getRoom, rooms, toSnapshot } from "../internal/registry";
import type { RoomListItem, RoomSnapshot, RoomState } from "../types";

export async function getRoomSnapshot(roomId: string): Promise<RoomSnapshot | null> {
  let room = await getRoom(roomId);
  if (!room) return null;

  if (dbRooms.dbEnabled()) {
    const fromDb = await dbRooms.fetchRoom(roomId);
    if (fromDb && fromDb.revision > room.revision) {
      rooms().set(roomId, fromDb);
      room = fromDb;
    }
  }

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

export async function joinRoomByInvite(
  inviteCode: string,
  userId: string
): Promise<RoomState | null> {
  const { joinAdventureByInvite } = await import("@/lib/adventure/store");
  const joinedAdv = await joinAdventureByInvite(inviteCode, userId);
  if (joinedAdv) {
    return getRoom(joinedAdv.primaryRoomId);
  }
  return joinRoomByInviteLegacy(inviteCode, userId);
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
      if (fromDb.ownerId !== userId && !fromDb.memberIds.includes(userId)) {
        fromDb.memberIds.push(userId);
        fromDb.updatedAt = Date.now();
        fromDb.revision += 1;
      }
      rooms().set(fromDb.roomId, fromDb);
      await dbRooms.saveRoom(fromDb);
      return syncAdventureActorsForRoom(fromDb.roomId);
    }
  }

  for (const room of rooms().values()) {
    if (room.inviteCode.toUpperCase() !== code) continue;
    if (room.ownerId !== userId && !room.memberIds.includes(userId)) {
      room.memberIds.push(userId);
      room.updatedAt = Date.now();
      room.revision += 1;
      if (dbRooms.dbEnabled()) {
        await dbRooms.saveRoom(room);
      }
    }
    return syncAdventureActorsForRoom(room.roomId);
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

export async function getRoomActor(roomId: string, actorId: string) {
  const room = await getRoom(roomId);
  return room?.actors[actorId] ?? null;
}
