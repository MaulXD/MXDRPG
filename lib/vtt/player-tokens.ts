import type { RoomActor } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

export function isPlayerRoomActor(actor: RoomActor): boolean {
  return !actor.gmAuthored && !actor.gmTemplateId;
}

export function isPlayerBattleToken(
  token: BattleToken,
  actors: Record<string, RoomActor>
): boolean {
  if (token.monsterEntryId || token.gmCreationId) return false;
  if (token.ownerRole === "jogador") return true;
  if (token.actorId) {
    const actor = actors[token.actorId];
    return Boolean(actor && isPlayerRoomActor(actor));
  }
  return false;
}

export function isTokenDowned(token: BattleToken): boolean {
  if (token.defeated) return true;
  if (token.vidaMax != null && token.vidaMax > 0) {
    return (token.vida ?? 0) <= 0;
  }
  return false;
}

export function isActorDowned(actor: RoomActor): boolean {
  return actor.resources.vida.value <= 0;
}
