import { DEMO_SCENE } from "@/lib/vtt/demo-scene";
import { emptyCombat } from "../combat";
import { welcomeChat } from "../chat";
import * as dbRooms from "@/lib/db/rooms";
import { getRoom, rooms, toSnapshot } from "../internal/registry";
import type { RoomListItem, RoomSnapshot, RoomState } from "../types";

function randomInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function slugRoomId(name: string): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "mesa";
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}

export async function getRoomSnapshot(roomId: string): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  return room ? toSnapshot(room) : null;
}

export async function createRoom(ownerId: string, name: string): Promise<RoomState> {
  const roomId = slugRoomId(name);
  const label = name.trim().slice(0, 80) || "Nova mesa";
  const scene = {
    ...DEMO_SCENE,
    id: roomId,
    name: label,
    tokens: [],
  };
  const state: RoomState = {
    roomId,
    ownerId,
    name: label,
    inviteCode: randomInviteCode(),
    memberIds: [],
    scene,
    actors: {},
    combat: emptyCombat([]),
    chat: [welcomeChat()],
    pings: [],
    revision: 1,
    updatedAt: Date.now(),
  };
  rooms().set(roomId, state);
  if (dbRooms.dbEnabled()) {
    await dbRooms.insertRoom(state);
  }
  return state;
}

export async function joinRoomByInvite(
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
      if (fromDb.roomId !== "demo") await dbRooms.saveRoom(fromDb);
      return fromDb;
    }
  }

  for (const room of rooms().values()) {
    if (room.inviteCode.toUpperCase() !== code) continue;
    if (room.ownerId !== userId && !room.memberIds.includes(userId)) {
      room.memberIds.push(userId);
      room.updatedAt = Date.now();
      room.revision += 1;
      if (dbRooms.dbEnabled() && room.roomId !== "demo") {
        await dbRooms.saveRoom(room);
      }
    }
    return room;
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
