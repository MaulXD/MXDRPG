import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";
import { getRoom, persistRoom } from "./internal/registry";
import type { RoomActor } from "./types";

/** Disponibiliza ficha na sala demo para spawn e edição na mesa. */
export async function attachCharacterToDemoRoom(sheet: CharacterSheet): Promise<void> {
  const room = await getRoom("demo");
  if (!room) return;

  const prev = room.actors[sheet.id];
  const actor: RoomActor = {
    ...normalizeCharacter(sheet),
    revision: (prev?.revision ?? 0) + 1,
  };
  room.actors[sheet.id] = actor;
  await persistRoom("demo", room);
}
