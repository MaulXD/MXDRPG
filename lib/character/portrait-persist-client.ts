"use client";

import { patchRoomActor } from "@/hooks/useRoomSync";
import { patchCharacterRecord } from "@/lib/character/character-persist-client";
import type { CharacterSheet } from "@/lib/character/types";
import type { PortraitBundle } from "@/lib/media/image-upload-client";

export { patchCharacterRecord } from "@/lib/character/character-persist-client";

export type PortraitPersistPatch = {
  portraitUrl: string | null;
  tokenImageUrl: string | null;
  portraitFocus: PortraitBundle["portraitFocus"] | null;
  coverFocus: PortraitBundle["coverFocus"] | null;
  tokenFocus: PortraitBundle["tokenFocus"] | null;
};

export function portraitBundleToPatch(bundle: PortraitBundle): PortraitPersistPatch {
  return {
    portraitUrl: bundle.portraitUrl,
    tokenImageUrl: bundle.tokenImageUrl,
    portraitFocus: bundle.portraitFocus,
    coverFocus: bundle.coverFocus,
    tokenFocus: bundle.tokenFocus,
  };
}

export const CLEAR_PORTRAIT_PATCH: PortraitPersistPatch = {
  portraitUrl: null,
  tokenImageUrl: null,
  portraitFocus: null,
  coverFocus: null,
  tokenFocus: null,
};

export async function persistPortraitBundleToCharacter(
  characterId: string,
  bundle: PortraitBundle
): Promise<{ character?: CharacterSheet }> {
  return patchCharacterRecord(characterId, portraitBundleToPatch(bundle));
}

export async function persistPortraitBundleToRoom(
  roomId: string,
  actorId: string,
  bundle: PortraitBundle
): Promise<void> {
  await patchRoomActor(roomId, actorId, portraitBundleToPatch(bundle));
}

export async function clearPortraitOnCharacter(characterId: string): Promise<void> {
  await patchCharacterRecord(characterId, CLEAR_PORTRAIT_PATCH);
}

export async function clearPortraitOnRoom(roomId: string, actorId: string): Promise<void> {
  await patchRoomActor(roomId, actorId, CLEAR_PORTRAIT_PATCH);
}
