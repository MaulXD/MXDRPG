import { isAdventureBoundCharacter } from "@/lib/character/adventure-bind";
import type { CharacterSheet } from "@/lib/character/types";
import {
  isActiveSheetEditGrant,
  type SheetEditGrant,
} from "@/lib/character/sheet-edit-request";

export type CharacterEditAccessOptions = {
  grant?: SheetEditGrant | null;
};

/** Dono edita a própria ficha; outros só com admin. */
export function canEditCharacterWithGrant(
  character: CharacterSheet,
  userId: string,
  role: "admin" | "member",
  _options?: CharacterEditAccessOptions
): boolean {
  if (role === "admin") return true;
  return character.ownerId === userId;
}

/** Reconstrução (wizard) em campanha exige concessão aprovada do mestre. */
export function canStructuralSheetEditWithGrant(
  character: CharacterSheet,
  userId: string,
  role: "admin" | "member",
  options?: CharacterEditAccessOptions
): boolean {
  if (role === "admin") return true;
  if (character.ownerId !== userId) return false;
  if (!isAdventureBoundCharacter(character)) return true;
  return isActiveSheetEditGrant(options?.grant);
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
