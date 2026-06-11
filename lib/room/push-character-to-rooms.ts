import { resolveAdventureId } from "@/lib/character/adventure-bind";
import type { CharacterSheet } from "@/lib/character/types";
import { getAdventure } from "@/lib/adventure/store";
import { attachCharacterToRoomState } from "./adventure-actors";
import { attachCharacterToDemoRoom } from "./demo-character-sync";
import { getRoom, persistRoom } from "./internal/registry";

/** Propaga ficha salva para salas ao vivo (demo + mesa da aventura). */
export async function pushCharacterSheetToLiveRooms(sheet: CharacterSheet): Promise<void> {
  const adventureId = resolveAdventureId(sheet) ?? sheet.adventureId ?? null;

  if (adventureId === "demo") {
    await attachCharacterToDemoRoom(sheet);
  }

  if (!adventureId || adventureId === "demo") return;

  const adv = await getAdventure(adventureId);
  const roomId = adv?.primaryRoomId?.trim();
  if (!roomId) return;

  const room = await getRoom(roomId);
  if (!room || !attachCharacterToRoomState(room, sheet)) return;

  await persistRoom(roomId, room);
}
