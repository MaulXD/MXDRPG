import "server-only";

import { canEditCharacter } from "@/lib/character/demo-characters";
import type { CharacterSheet } from "@/lib/character/types";
import type { SessionUser } from "@/lib/auth/types";
import { canManageRoom } from "@/lib/auth/room-access";
import { getRoom } from "@/lib/room/store";

/** Retrato na ficha fora da mesa — dono ou mestre da campanha vinculada. */
export async function canEditCharacterPortrait(
  character: CharacterSheet,
  user: SessionUser
): Promise<boolean> {
  if (canEditCharacter(character, user.id, user.role)) return true;
  const roomId = character.campaignRoomId ?? character.adventureId;
  if (!roomId) return false;
  const room = await getRoom(roomId);
  if (!room) return false;
  return canManageRoom(room, user);
}
