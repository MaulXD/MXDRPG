import { getAdventure } from "@/lib/adventure/store";
import { resolveAdventureId } from "@/lib/character/adventure-bind";
import type { CharacterSheet } from "@/lib/character/types";

/**
 * BV-045b: contexto de mesa (mestre e membros) para checar a regra de inventário
 * fora da mesa, como /personagem/[id] e PATCH /api/characters/[id].
 * Sem aventura vinculada ou aventura não encontrada, devolve null.
 */
export async function inventoryApprovalRoomFor(
  character: Pick<CharacterSheet, "adventureId" | "campaignRoomId">
): Promise<{
  roomId: string;
  adventureId: string;
  ownerId: string;
  memberIds?: string[];
} | null> {
  const adventureId = resolveAdventureId(character);
  if (!adventureId) return null;
  const adventure = await getAdventure(adventureId);
  if (!adventure) return null;
  return {
    roomId: adventure.adventureId,
    adventureId: adventure.adventureId,
    ownerId: adventure.ownerId,
    memberIds: adventure.memberIds,
  };
}
