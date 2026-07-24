import { resolveAdventureId } from "@/lib/character/adventure-bind";
import type { CharacterSheet } from "@/lib/character/types";
import { getAdventure } from "@/lib/adventure/store";
import { attachCharacterToRoomState } from "./adventure-actors";
import { getRoom, persistRoom } from "./internal/registry";

/** Propaga ficha salva para a mesa ao vivo da aventura. */
export async function pushCharacterSheetToLiveRooms(sheet: CharacterSheet): Promise<void> {
  const adventureId = resolveAdventureId(sheet) ?? sheet.adventureId ?? null;
  if (!adventureId) return;

  const adv = await getAdventure(adventureId);
  const roomId = adv?.primaryRoomId?.trim();
  if (!roomId) return;

  const room = await getRoom(roomId);
  if (!room || !attachCharacterToRoomState(room, sheet)) return;

  await persistRoom(roomId, room);
}
