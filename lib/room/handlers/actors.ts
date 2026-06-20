import { applyLevelUp, canLevelUp, type LevelUpChoices } from "@/lib/character/level-up";
import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";
import type { IdentityPatch } from "@/lib/character/identity";
import { validateDisplayName } from "@/lib/moderation/display-name";
import { mergeIdentityPatch, sanitizeActorPatch } from "../internal/actor-patch";
import { persistActorToAdventureSheet } from "../adventure-actors";
import {
  resolveActorTokenImageUrl,
  resolveLinkedTokenImageFocus,
} from "../portrait-sync";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomActor, RoomSnapshot } from "../types";

export async function updateRoomActor(
  roomId: string,
  actorId: string,
  patch: Partial<CharacterSheet> & { identityPatch?: IdentityPatch }
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const current = room.actors[actorId];
  if (!current) return null;

  if (patch.name !== undefined) {
    const checked = validateDisplayName(String(patch.name));
    if (!checked.ok) return null;
    patch = { ...patch, name: checked.name };
  }

  const safe = await sanitizeActorPatch(patch);
  const hasIdentity = Boolean(patch.identityPatch);
  if (!Object.keys(safe).length && !hasIdentity) return toSnapshot(room);

  let next: RoomActor = {
    ...current,
    ...safe,
    id: current.id,
    ownerId: current.ownerId,
    revision: current.revision + 1,
  };

  if (patch.identityPatch) {
    next = { ...mergeIdentityPatch(next, patch.identityPatch), revision: current.revision + 1 };
  }

  next = { ...normalizeCharacter(next), revision: current.revision + 1 };
  room.actors[actorId] = next;

  const portraitTouched =
    "portraitUrl" in safe ||
    "tokenImageUrl" in safe ||
    "portraitFocus" in safe ||
    "coverFocus" in safe ||
    "tokenFocus" in safe;

  if (portraitTouched) {
    const imageUrl = resolveActorTokenImageUrl(next);
    const imageFocus = resolveLinkedTokenImageFocus(next);
    room.scene = {
      ...room.scene,
      tokens: room.scene.tokens.map((t) => {
        if (!t.linked || t.actorId !== actorId) return t;
        return {
          ...t,
          imageUrl: imageUrl ?? undefined,
          imageFocus,
        };
      }),
    };
  }

  await persistActorToAdventureSheet(next).catch((e) => {
    console.error("[updateRoomActor] persist sheet failed:", actorId, e);
  });
  return toSnapshot(await persistRoom(roomId, room));
}

export async function levelUpRoomActor(
  roomId: string,
  actorId: string,
  choices: LevelUpChoices = {}
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const current = room.actors[actorId];
  if (!current) return null;

  if (!canLevelUp(current)) return null;

  const leveled = normalizeCharacter(applyLevelUp(current, choices));
  const next = { ...leveled, revision: current.revision + 1 };
  room.actors[actorId] = next;
  await persistActorToAdventureSheet(next);

  return toSnapshot(await persistRoom(roomId, room));
}
