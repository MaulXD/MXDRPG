import { characterOwnedBySessionUser } from "@/lib/auth/account-ownership";
import type { SessionUser } from "@/lib/auth/types";
import { characterBelongsToAdventure } from "@/lib/character/adventure-bind";
import type { RoomActor } from "@/lib/room/types";

/** Personagens de jogador na aventura (exclui NPCs do mestre). */
export function listPlayablePlayerActors(
  actors: Record<string, RoomActor>,
  adventureId: string
): RoomActor[] {
  return Object.values(actors)
    .filter((a) => !a.gmAuthored && !a.gmTemplateId)
    .filter((a) => characterBelongsToAdventure(a, adventureId))
    .sort((a, b) => {
      const byLevel = a.identity.nivel - b.identity.nivel;
      if (byLevel !== 0) return byLevel;
      return a.name.localeCompare(b.name, "pt-BR");
    });
}

export function isActorOwnedByUser(
  actor: Pick<RoomActor, "ownerId">,
  user: Pick<SessionUser, "id" | "clerkId"> | string | null | undefined
): boolean {
  if (!user) return false;
  if (typeof user === "string") return Boolean(actor.ownerId === user);
  return characterOwnedBySessionUser(actor, user);
}
