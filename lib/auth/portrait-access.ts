import type { CharacterSheet } from "@/lib/character/types";
import type { SessionUser } from "@/lib/auth/types";
import { characterOwnedBySessionUser } from "@/lib/auth/account-ownership";
import {
  actorForRoomAuth,
  canEditRoomActor,
  canManageRoom,
  canParticipateInRoom,
} from "@/lib/auth/room-access";
import { characterBelongsToRoom } from "@/lib/character/adventure-bind";
import type { RoomState } from "@/lib/room/types";

export const PORTRAIT_PATCH_KEYS = [
  "portraitUrl",
  "tokenImageUrl",
  "portraitFocus",
  "coverFocus",
  "tokenFocus",
] as const;

export function isPortraitOnlyPatch(body: Record<string, unknown>): boolean {
  const keys = Object.keys(body);
  if (!keys.length) return false;
  return keys.every((k) => (PORTRAIT_PATCH_KEYS as readonly string[]).includes(k));
}

/** Retrato/token na mesa — dono da ficha ou mestre da sala. */
export function canEditRoomActorPortrait(
  room: Pick<RoomState, "roomId" | "ownerId"> & { adventureId?: string },
  actor: Pick<CharacterSheet, "id" | "ownerId" | "adventureId" | "campaignRoomId">,
  user: SessionUser | null | undefined
): boolean {
  if (user && characterOwnedBySessionUser(actorForRoomAuth(room, actor), user)) {
    return true;
  }
  if (canEditRoomActor(room, actor, user)) return true;
  if (!user || !canParticipateInRoom(room as RoomState, user)) return false;
  const authActor = actorForRoomAuth(room, actor);
  if (!characterBelongsToRoom(room, authActor)) return false;
  return canManageRoom(room, user);
}

