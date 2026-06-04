import {
  listCharactersForUserInAdventure,
  saveCharacter,
} from "@/lib/character/characters";
import {
  characterBelongsToAdventure,
  isAdventureBoundCharacter,
  resolveAdventureId,
} from "@/lib/character/adventure-bind";
import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";
import { getRoom, persistRoom } from "./internal/registry";
import type { RoomActor, RoomState } from "./types";

function participantIds(room: RoomState): string[] {
  return [...new Set([room.ownerId, ...room.memberIds])];
}

function toRoomActor(sheet: CharacterSheet, prev?: RoomActor): RoomActor {
  return {
    ...normalizeCharacter(sheet),
    revision: prev?.revision ?? 1,
  };
}

export function attachCharacterToRoomState(
  room: RoomState,
  sheet: CharacterSheet
): boolean {
  const adventureId = room.adventureId ?? room.roomId;
  if (!characterBelongsToAdventure(sheet, adventureId)) return false;
  const prev = room.actors[sheet.id];
  room.actors[sheet.id] = toRoomActor(sheet, prev);
  return true;
}

/** Sincroniza fichas da aventura para a mesa ao vivo. */
export async function syncAdventureActorsForRoom(roomId: string): Promise<RoomState | null> {
  const room = await getRoom(roomId);
  if (!room || roomId === "demo") return room;

  const adventureId = room.adventureId ?? room.roomId;
  let changed = false;

  for (const [actorId, actor] of Object.entries(room.actors)) {
    if (!isAdventureBoundCharacter(actor)) continue;
    const actorAdv = resolveAdventureId(actor);
    if (actorAdv !== adventureId) {
      delete room.actors[actorId];
      room.scene = {
        ...room.scene,
        tokens: room.scene.tokens.filter((t) => t.actorId !== actorId),
      };
      if (room.combat?.order) {
        room.combat = {
          ...room.combat,
          order: room.combat.order.filter((id) => {
            const tok = room.scene.tokens.find((t) => t.id === id);
            return tok?.actorId !== actorId;
          }),
        };
      }
      changed = true;
    }
  }

  for (const userId of participantIds(room)) {
    const sheets = await listCharactersForUserInAdventure(userId, adventureId);
    for (const sheet of sheets) {
      if (attachCharacterToRoomState(room, sheet)) changed = true;
    }
  }

  if (!changed) return room;
  return persistRoom(roomId, room);
}

export async function persistActorToAdventureSheet(actor: RoomActor): Promise<void> {
  if (!isAdventureBoundCharacter(actor)) return;
  const { revision: _r, ...sheet } = actor;
  await saveCharacter(sheet);
}

/** @deprecated use syncAdventureActorsForRoom */
export const syncCampaignActorsForRoom = syncAdventureActorsForRoom;
