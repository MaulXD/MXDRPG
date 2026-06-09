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
