import type { CharacterSheet } from "@/lib/character/types";

/** Uma ficha de jogador por aventura. */
export const MAX_CHARACTERS_PER_USER_PER_ADVENTURE = 3;

export function resolveAdventureId(
  sheet: Pick<CharacterSheet, "adventureId" | "campaignRoomId">
): string | null {
  return sheet.adventureId?.trim() || sheet.campaignRoomId?.trim() || null;
}

export function characterBelongsToAdventure(
  sheet: Pick<CharacterSheet, "adventureId" | "campaignRoomId">,
  adventureId: string
): boolean {
  const bound = resolveAdventureId(sheet);
  if (!bound) return adventureId === "demo";
  return bound === adventureId;
}

export function isAdventureBoundCharacter(
  sheet: Pick<CharacterSheet, "adventureId" | "campaignRoomId">
): boolean {
  return Boolean(resolveAdventureId(sheet));
}

/** Ficha pertence à aventura/mesa atual (slug da aventura ou roomId de campanha). */
export function characterBelongsToRoom(
  room: { roomId: string; adventureId?: string },
  actor: Pick<CharacterSheet, "adventureId" | "campaignRoomId">
): boolean {
  const roomAdventureId = room.adventureId ?? room.roomId;
  const bound = resolveAdventureId(actor);
  if (bound && bound === roomAdventureId) return true;
  if (actor.campaignRoomId === room.roomId) return true;
  if (bound === room.roomId) return true;
  if (!bound) return roomAdventureId === "demo";
  return false;
}
