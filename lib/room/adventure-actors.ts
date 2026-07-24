import { resolveCharacterAccount } from "@/lib/auth/account-user";
import {
  listCharactersForUserInAdventure,
  resolveCharacter,
  saveCharacter,
} from "@/lib/character/characters";
import {
  characterBelongsToAdventure,
  resolveAdventureId,
} from "@/lib/character/adventure-bind";
import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";
import { getRoom, persistRoom } from "./internal/registry";
import {
  resolveActorTokenImageUrl,
  resolveLinkedTokenImageFocus,
} from "./portrait-sync";
import type { RoomActor, RoomState } from "./types";

function participantIds(room: RoomState): string[] {
  return [...new Set([room.ownerId, ...room.memberIds])];
}

async function resolvedParticipantIds(room: RoomState): Promise<string[]> {
  const accounts = await Promise.all(
    participantIds(room).map((userId) => resolveCharacterAccount(userId))
  );
  return [...new Set(accounts.map((a) => a.canonicalId))];
}

/** Ator ainda pertence a esta mesa/aventura (tolerante a legado sem adventureId). */
export function actorBelongsToRoom(room: RoomState, actor: RoomActor): boolean {
  if (actor.gmAuthored) return true;
  const adventureId = room.adventureId ?? room.roomId;
  const effectiveAdv = resolveAdventureId(actor) ?? adventureId;
  return characterBelongsToAdventure(
    { adventureId: effectiveAdv, campaignRoomId: actor.campaignRoomId ?? room.roomId },
    adventureId
  );
}

function mergePortraitFromRoom(sheet: CharacterSheet, prev?: RoomActor): CharacterSheet {
  if (!prev) return sheet;

  const sheetHasPortrait = Boolean(sheet.portraitUrl || sheet.tokenImageUrl);
  const roomHasPortrait = Boolean(prev.portraitUrl || prev.tokenImageUrl);
  const portraitChangedOnSheet =
    sheetHasPortrait &&
    ((sheet.tokenImageUrl ?? "") !== (prev.tokenImageUrl ?? "") ||
      (sheet.portraitUrl ?? "") !== (prev.portraitUrl ?? ""));

  // Ficha no DB atualizada (ex.: /personagem) — propaga para a mesa
  if (portraitChangedOnSheet) {
    return {
      ...sheet,
      portraitUrl: sheet.portraitUrl ?? prev.portraitUrl ?? null,
      tokenImageUrl: sheet.tokenImageUrl ?? prev.tokenImageUrl ?? null,
      portraitFocus: sheet.portraitFocus ?? prev.portraitFocus ?? null,
      coverFocus: sheet.coverFocus ?? prev.coverFocus ?? null,
      tokenFocus: sheet.tokenFocus ?? prev.tokenFocus ?? null,
    };
  }

  // Mesa viva com retrato — não sobrescreve com ficha DB vazia/antiga
  if (roomHasPortrait && (prev.revision ?? 0) > 0) {
    return {
      ...sheet,
      portraitUrl: prev.portraitUrl ?? sheet.portraitUrl ?? null,
      tokenImageUrl: prev.tokenImageUrl ?? sheet.tokenImageUrl ?? null,
      portraitFocus: prev.portraitFocus ?? sheet.portraitFocus ?? null,
      coverFocus: prev.coverFocus ?? sheet.coverFocus ?? null,
      tokenFocus: prev.tokenFocus ?? sheet.tokenFocus ?? null,
    };
  }

  let merged: CharacterSheet = {
    ...sheet,
    portraitUrl: sheet.portraitUrl ?? prev.portraitUrl ?? null,
    tokenImageUrl: sheet.tokenImageUrl ?? prev.tokenImageUrl ?? null,
    portraitFocus: sheet.portraitFocus ?? prev.portraitFocus ?? null,
    coverFocus: sheet.coverFocus ?? prev.coverFocus ?? null,
    tokenFocus: sheet.tokenFocus ?? prev.tokenFocus ?? null,
  };

  const sheetHasGear =
    (sheet.inventory?.length ?? 0) > 0 ||
    sheet.combatLoadout != null ||
    sheet.armorLoadout != null;
  const prevMissingGear =
    !prev.inventory?.length && prev.combatLoadout == null && prev.armorLoadout == null;

  if (sheetHasGear && prevMissingGear) {
    merged = {
      ...merged,
      inventory: sheet.inventory,
      combatLoadout: sheet.combatLoadout ?? null,
      armorLoadout: sheet.armorLoadout ?? null,
      lootEconomy: sheet.lootEconomy ?? merged.lootEconomy,
    };
  }

  return merged;
}

function portraitChangedBetween(prev: RoomActor | undefined, next: RoomActor): boolean {
  if (!prev) return Boolean(next.portraitUrl || next.tokenImageUrl);
  return (
    (next.portraitUrl ?? "") !== (prev.portraitUrl ?? "") ||
    (next.tokenImageUrl ?? "") !== (prev.tokenImageUrl ?? "") ||
    JSON.stringify(next.portraitFocus ?? null) !== JSON.stringify(prev.portraitFocus ?? null) ||
    JSON.stringify(next.coverFocus ?? null) !== JSON.stringify(prev.coverFocus ?? null) ||
    JSON.stringify(next.tokenFocus ?? null) !== JSON.stringify(prev.tokenFocus ?? null)
  );
}

function syncLinkedTokenPortraits(room: RoomState, actorId: string, actor: RoomActor): void {
  const imageUrl = resolveActorTokenImageUrl(actor);
  const imageFocus = resolveLinkedTokenImageFocus(actor);
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
function portraitBackfillNeeded(sheet: CharacterSheet, prev?: RoomActor): boolean {
  if (!prev) return false;
  return Boolean(
    (!sheet.portraitUrl && prev.portraitUrl) || (!sheet.tokenImageUrl && prev.tokenImageUrl)
  );
}

function toRoomActor(sheet: CharacterSheet, prev?: RoomActor): RoomActor | null {
  try {
    return {
      ...normalizeCharacter(mergePortraitFromRoom(sheet, prev)),
      revision: prev?.revision ?? 1,
    };
  } catch (err) {
    console.warn("[toRoomActor] ficha ignorada:", sheet.id, err);
    return null;
  }
}

export function attachCharacterToRoomState(
  room: RoomState,
  sheet: CharacterSheet
): boolean {
  const adventureId = room.adventureId ?? room.roomId;
  if (!characterBelongsToAdventure(sheet, adventureId)) return false;
  const prev = room.actors[sheet.id];
  const actor = toRoomActor(sheet, prev);
  if (!actor) return false;
  room.actors[sheet.id] = actor;
  return true;
}

/** Sincroniza fichas da aventura para a mesa ao vivo. */
export async function syncAdventureActorsForRoom(roomId: string): Promise<RoomState | null> {
  try {
    const room = await getRoom(roomId);
    if (!room) return room;

    const adventureId = room.adventureId ?? room.roomId;
    let changed = false;
    const backfills: RoomActor[] = [];

    for (const [actorId, actor] of Object.entries(room.actors)) {
      if (actorBelongsToRoom(room, actor)) continue;
      delete room.actors[actorId];
      room.scene = {
        ...room.scene,
        tokens: room.scene.tokens.filter((t) => t.actorId !== actorId),
      };
      if (room.combat?.order) {
        room.combat = {
          ...room.combat,
          order: room.combat.order.filter((id) => {
            const tok = room.scene.tokens.find((t) => t.id === id);
            return tok?.actorId !== actorId;
          }),
        };
      }
      changed = true;
    }

    const resolvedIds = await resolvedParticipantIds(room);
    const sheetsByParticipant = await Promise.all(
      resolvedIds.map((userId) => listCharactersForUserInAdventure(userId, adventureId))
    );
    for (const sheets of sheetsByParticipant) {
      for (const sheet of sheets) {
        if (!characterBelongsToAdventure(sheet, adventureId)) continue;
        const prev = room.actors[sheet.id];
        const next = toRoomActor(sheet, prev);
        if (!next) continue;
        room.actors[sheet.id] = next;
        if (portraitChangedBetween(prev, next)) {
          syncLinkedTokenPortraits(room, sheet.id, next);
        }
        changed = true;
        if (portraitBackfillNeeded(sheet, prev)) backfills.push(next);
      }
    }

    if (!changed) return room;
    const saved = await persistRoom(roomId, room);
    for (const actor of backfills) {
      try {
        await persistActorToAdventureSheet(actor);
      } catch (err) {
        console.warn("[syncAdventureActorsForRoom] backfill ficha:", actor.id, err);
      }
    }
    return saved;
  } catch (err) {
    console.error("[syncAdventureActorsForRoom]", roomId, err);
    return getRoom(roomId);
  }
}

export async function persistActorToAdventureSheet(actor: RoomActor): Promise<void> {
  if (actor.gmAuthored) return;
  const { revision: _r, ...sheet } = actor;
  await saveCharacter(sheet);
}

/** Reanexa ficha do banco se sumiu da mesa (ex.: após retirar token do mapa). */
export async function ensureAdventureActorInRoom(
  roomId: string,
  actorId: string
): Promise<RoomState | null> {
  const room = await getRoom(roomId);
  if (!room || room.actors[actorId]) return room;

  const sheet = await resolveCharacter(actorId);
  if (!sheet) return room;
  if (!attachCharacterToRoomState(room, sheet)) return room;

  return persistRoom(roomId, room);
}

/** @deprecated use syncAdventureActorsForRoom */
export const syncCampaignActorsForRoom = syncAdventureActorsForRoom;
