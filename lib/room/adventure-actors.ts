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
import type { RoomActor, RoomState } from "./types";

function participantIds(room: RoomState): string[] {
  return [...new Set([room.ownerId, ...room.memberIds])];
}

async function resolvedParticipantIds(room: RoomState): Promise<string[]> {
  const canonical = new Set<string>();
  for (const userId of participantIds(room)) {
    const account = await resolveCharacterAccount(userId);
    canonical.add(account.canonicalId);
  }
  return [...canonical];
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
  let merged: CharacterSheet = {
    ...sheet,
    portraitUrl: sheet.portraitUrl ?? prev.portraitUrl ?? null,
    tokenImageUrl: sheet.tokenImageUrl ?? prev.tokenImageUrl ?? null,
    portraitFocus: sheet.portraitFocus ?? prev.portraitFocus ?? null,
    coverFocus: sheet.coverFocus ?? prev.coverFocus ?? null,
    tokenFocus: sheet.tokenFocus ?? prev.tokenFocus ?? null,
  };

  const sheetHasGear =
    sheet.inventory.length > 0 || sheet.combatLoadout != null || sheet.armorLoadout != null;
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

function portraitBackfillNeeded(sheet: CharacterSheet, prev?: RoomActor): boolean {
  if (!prev) return false;
  return Boolean(
    (!sheet.portraitUrl && prev.portraitUrl) || (!sheet.tokenImageUrl && prev.tokenImageUrl)
  );
}

function toRoomActor(sheet: CharacterSheet, prev?: RoomActor): RoomActor {
  return {
    ...normalizeCharacter(mergePortraitFromRoom(sheet, prev)),
    revision: prev?.revision ?? 1,
  };
}

export function attachCharacterToRoomState(
  room: RoomState,
  sheet: CharacterSheet
): boolean {
  const adventureId = room.adventureId ?? room.roomId;
  if (!characterBelongsToAdventure(sheet, adventureId)) return false;
  const prev = room.actors[sheet.id];
  room.actors[sheet.id] = toRoomActor(sheet, prev);
  return true;
}

/** Sincroniza fichas da aventura para a mesa ao vivo. */
export async function syncAdventureActorsForRoom(roomId: string): Promise<RoomState | null> {
  const room = await getRoom(roomId);
  if (!room || roomId === "demo") return room;

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

  for (const userId of await resolvedParticipantIds(room)) {
    const sheets = await listCharactersForUserInAdventure(userId, adventureId);
    for (const sheet of sheets) {
      if (!characterBelongsToAdventure(sheet, adventureId)) continue;
      const prev = room.actors[sheet.id];
      const next = toRoomActor(sheet, prev);
      room.actors[sheet.id] = next;
      changed = true;
      if (portraitBackfillNeeded(sheet, prev)) backfills.push(next);
    }
  }

  if (!changed) return room;
  const saved = await persistRoom(roomId, room);
  for (const actor of backfills) {
    await persistActorToAdventureSheet(actor);
  }
  return saved;
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
