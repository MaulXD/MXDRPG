"use client";

import { patchRoomActor } from "@/hooks/useRoomSync";
import { patchCharacterRecord } from "@/lib/character/character-persist-client";
import type { CharacterSheet } from "@/lib/character/types";
import type { TorCharacterSheet } from "@/lib/character/um-anel/types";
import type { PortraitBundle } from "@/lib/media/image-upload-client";
import type { RoomActor } from "@/lib/room/types";

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

export type RoomActorPatchResult = {
  actor: RoomActor;
  scene: import("@/lib/room/types").RoomSnapshot["scene"];
  revision: number;
};

export function mergePortraitPatchIntoSnapshot(
  snapshot: import("@/lib/room/types").RoomSnapshot,
  result: RoomActorPatchResult
): import("@/lib/room/types").RoomSnapshot {
  return {
    ...snapshot,
    revision: result.revision,
    scene: result.scene,
    actors: { ...snapshot.actors, [result.actor.id]: result.actor },
  };
}

export async function persistPortraitBundleToRoom(
  roomId: string,
  actorId: string,
  bundle: PortraitBundle
): Promise<RoomActorPatchResult | null> {
  return patchRoomActor(roomId, actorId, portraitBundleToPatch(bundle));
}

export async function clearPortraitOnCharacter(characterId: string): Promise<void> {
  await patchCharacterRecord(characterId, CLEAR_PORTRAIT_PATCH);
}

async function patchTorCharacterRecord(
  characterId: string,
  body: Record<string, unknown>
): Promise<{ character?: TorCharacterSheet }> {
  const res = await fetch(`/api/tor-characters/${encodeURIComponent(characterId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<{ character?: TorCharacterSheet }>;
}

export async function persistPortraitBundleToTorCharacter(
  characterId: string,
  bundle: PortraitBundle
): Promise<{ character?: TorCharacterSheet }> {
  return patchTorCharacterRecord(characterId, portraitBundleToPatch(bundle));
}

export async function clearPortraitOnTorCharacter(characterId: string): Promise<void> {
  await patchTorCharacterRecord(characterId, CLEAR_PORTRAIT_PATCH);
}

export async function clearPortraitOnRoom(
  roomId: string,
  actorId: string
): Promise<RoomActorPatchResult | null> {
  return patchRoomActor(roomId, actorId, CLEAR_PORTRAIT_PATCH);
}
