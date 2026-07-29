import * as dbAdventures from "@/lib/db/adventures";
import type { Adventure } from "@/lib/adventure/types";
import { dbEnabled } from "@/lib/db/enabled";
import { fetchClerkIdForUser } from "@/lib/db/users";
import { DEFAULT_ROOM_SETTINGS } from "@/lib/room/settings";
import { emptyCombat } from "./combat";
import { welcomeChat } from "./chat";
import * as dbRooms from "@/lib/db/rooms";
import { getRoom, persistRoom, rooms } from "./internal/registry";
import type { RoomState } from "./types";

/**
 * Grid/tamanho de célula default de uma mesa nova (sem tokens de exemplo).
 * gridRadius precisa ser >= DISPLAY_GRID_RADIUS_CAP (lib/vtt/grid-cells.ts, hoje 24) —
 * o grid é DESENHADO até esse raio pra preencher o viewport (evita borda "andando" no
 * zoom/pan), mas só as células dentro de scene.gridRadius são válidas pra colocar token
 * (lib/vtt/dungeon-layer.ts::cellInGridBounds). Um raio real menor que o desenhado cria
 * uma "zona morta" invisível — visualmente parece grid válido, mas todo drop lá fora
 * falha com "Célula bloqueada, ocupada ou sem espaço".
 */
const DEFAULT_SCENE_TEMPLATE = { gridRadius: 24, cellSize: 36 };

export async function createRoomForAdventure(adventure: Adventure): Promise<RoomState> {
  const roomId = adventure.primaryRoomId;
  const scene = {
    ...DEFAULT_SCENE_TEMPLATE,
    id: roomId,
    name: adventure.name,
    tokens: [],
  };
  const state: RoomState = {
    roomId,
    adventureId: adventure.adventureId,
    rpgSystemId: adventure.rpgSystemId,
    ownerId: adventure.ownerId,
    name: adventure.name,
    inviteCode: adventure.inviteCode,
    memberIds: [...adventure.memberIds],
    settings: { ...DEFAULT_ROOM_SETTINGS },
    scene,
    actors: {},
    combat: emptyCombat(),
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

export async function joinRoomMembers(roomId: string, userId: string): Promise<void> {
  const room = await getRoom(roomId);
  if (!room) return;

  const clerkId = await fetchClerkIdForUser(userId);
  const alias = clerkId ? `clerk-${clerkId}` : null;
  let changed = false;

  if (room.ownerId === userId) return;

  if (alias && room.memberIds.includes(alias) && !room.memberIds.includes(userId)) {
    room.memberIds = room.memberIds.map((id) => (id === alias ? userId : id));
    changed = true;
  } else if (alias && room.memberIds.includes(alias) && room.memberIds.includes(userId)) {
    room.memberIds = room.memberIds.filter((id) => id !== alias);
    changed = true;
  } else if (!room.memberIds.includes(userId)) {
    room.memberIds.push(userId);
    changed = true;
  }

  if (changed) {
    room.updatedAt = Date.now();
    room.revision += 1;
    rooms().set(roomId, room);
    if (dbRooms.dbEnabled()) {
      try {
        await dbRooms.saveRoom(room);
      } catch (err) {
        console.error("[joinRoomMembers] saveRoom falhou:", roomId, err);
      }
    }
  }
}

export async function syncAdventureMembersToRoom(adventure: Adventure): Promise<void> {
  const room = await getRoom(adventure.primaryRoomId);
  if (!room) return;
  const members = new Set(adventure.memberIds);
  let changed = false;
  for (const id of members) {
    if (!room.memberIds.includes(id)) {
      room.memberIds.push(id);
      changed = true;
    }
  }
  room.inviteCode = adventure.inviteCode;
  room.name = adventure.name;
  room.adventureId = adventure.adventureId;
  if (changed) {
    room.revision += 1;
    room.updatedAt = Date.now();
  }
  rooms().set(room.roomId, room);
  if (dbRooms.dbEnabled()) {
    await dbRooms.saveRoom(room);
  }
}
