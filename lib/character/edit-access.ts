import { isAdventureBoundCharacter } from "@/lib/character/adventure-bind";
import type { CharacterSheet } from "@/lib/character/types";
import {
  isActiveSheetEditGrant,
  type SheetEditGrant,
} from "@/lib/character/sheet-edit-request";

export type CharacterEditAccessOptions = {
  grant?: SheetEditGrant | null;
};

/** Dono pode editar ficha livre fora de campanha; em campanha exige concessão aprovada. */
export function canEditCharacterWithGrant(
  character: CharacterSheet,
  userId: string,
  role: "admin" | "member",
  options?: CharacterEditAccessOptions
): boolean {
  if (role === "admin") return true;
  if (character.ownerId !== userId) return false;
  if (isAdventureBoundCharacter(character)) {
    return isActiveSheetEditGrant(options?.grant);
  }
  return true;
}

export function grantFromRequest(
  request: { id: string; characterId: string; scope: SheetEditGrant["scope"]; status: SheetEditGrant["status"] } | null
): SheetEditGrant | null {
  if (!request || request.status !== "approved") return null;
  return {
    id: request.id,
    characterId: request.characterId,
    scope: request.scope,
    status: request.status,
  };
}
