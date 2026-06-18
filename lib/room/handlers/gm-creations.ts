import {
  buildGmCreation,
  canEditGmCreation,
  createCreatureTokenFromGmCreation,
  getRoomGmCreations,
  npcInstanceFromGmCreation,
  patchGmCreation,
  setRoomGmCreations,
  type CreateGmCreationInput,
  type GmCreation,
  type GmCreatureStats,
} from "@/lib/room/gm-creations";
import { createPlayerTokenFromActor } from "@/lib/vtt/player-token";
import { nextMonsterDisplayName } from "@/lib/vtt/monster-display-name";
import { prepareSpawnedTokenPa } from "@/lib/combat/turn-economy";
import type { Axial } from "@/lib/vtt/grid-math";
import type { CharacterSheet } from "@/lib/character/types";
import { resolveSpawnAnchor } from "@/lib/vtt/dungeon-layer";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot } from "../types";
import type { SpawnExecuteResult } from "./tokens";

export type GmCreationResult =
  | { ok: true; snapshot: RoomSnapshot; creation: GmCreation }
  | { ok: false; error: string };

export async function createRoomGmCreation(
  roomId: string,
  userId: string,
  input: CreateGmCreationInput
): Promise<GmCreationResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const creation = buildGmCreation(room, userId, input);
  if (!creation) return { ok: false, error: "Origem inválida para clonar" };

  const creations = { ...getRoomGmCreations(room), [creation.id]: creation };
  const updated = await persistRoom(roomId, setRoomGmCreations(room, creations));
  return { ok: true, snapshot: toSnapshot(updated), creation };
}

export async function updateRoomGmCreation(
  roomId: string,
  creationId: string,
  userId: string,
  userRole: string | undefined,
  patch: {
    name?: string;
    creature?: Partial<GmCreatureStats>;
    npc?: Partial<CharacterSheet>;
  }
): Promise<GmCreationResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const creations = getRoomGmCreations(room);
  const current = creations[creationId];
  if (!current) return { ok: false, error: "Template não encontrado" };
  if (!canEditGmCreation(room, current, userId, userRole)) {
    return { ok: false, error: "Só o mestre pode editar templates que ele criou" };
  }

  const next = patchGmCreation(current, patch);
  const updated = await persistRoom(
    roomId,
    setRoomGmCreations(room, { ...creations, [creationId]: next })
  );
  return { ok: true, snapshot: toSnapshot(updated), creation: next };
}

export async function deleteRoomGmCreation(
  roomId: string,
  creationId: string,
  userId: string,
  userRole: string | undefined
): Promise<{ ok: true; snapshot: RoomSnapshot } | { ok: false; error: string }> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const creations = getRoomGmCreations(room);
  const current = creations[creationId];
  if (!current) return { ok: false, error: "Template não encontrado" };
  if (!canEditGmCreation(room, current, userId, userRole)) {
    return { ok: false, error: "Sem permissão" };
  }

  const { [creationId]: _removed, ...rest } = creations;
  const updated = await persistRoom(roomId, setRoomGmCreations(room, rest));
  return { ok: true, snapshot: toSnapshot(updated) };
}

export async function spawnRoomGmCreation(
  roomId: string,
  creationId: string,
  axial: Axial
): Promise<SpawnExecuteResult> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const creation = getRoomGmCreations(room)[creationId];
  if (!creation) return { ok: false, error: "Template não encontrado" };

  if (creation.kind === "creature") {
    const token = createCreatureTokenFromGmCreation(creation, axial);
    if (!token) return { ok: false, error: "Criatura inválida" };
    const anchor = resolveSpawnAnchor(room.scene, axial, { token });
    if (!anchor) {
      return { ok: false, error: "Célula bloqueada, ocupada ou sem espaço para a criatura" };
    }
    const placed =
      anchor.q === token.axial.q && anchor.r === token.axial.r
        ? token
        : { ...token, axial: anchor };
    const baseName =
      creation.source.type === "monster"
        ? (creation.source.label ?? placed.name.replace(/\s*\(custom\)\s*$/i, ""))
        : placed.name.replace(/\s*\(custom\)\s*$/i, "");
    placed.name = nextMonsterDisplayName(room.scene.tokens, baseName || "Monstro");
    room.scene = { ...room.scene, tokens: [...room.scene.tokens, placed] };
    if (room.combat?.order?.length) {
      room.combat = { ...room.combat, order: [...room.combat.order, placed.id] };
    }
    prepareSpawnedTokenPa(room, placed.id);
    const updated = await persistRoom(roomId, room);
    return { ok: true, snapshot: toSnapshot(updated), tokenId: placed.id };
  }

  const instance = npcInstanceFromGmCreation(creation, room);
  if (!instance) return { ok: false, error: "Personagem inválido" };

  room.actors[instance.id] = instance;
  const token = createPlayerTokenFromActor(instance, axial);
  const anchor = resolveSpawnAnchor(room.scene, axial, { token });
  if (!anchor) {
    return { ok: false, error: "Célula bloqueada, ocupada ou sem espaço" };
  }
  const placed =
    anchor.q === token.axial.q && anchor.r === token.axial.r
      ? token
      : { ...token, axial: anchor };
  placed.ownerRole = "mestre";
  room.scene = { ...room.scene, tokens: [...room.scene.tokens, placed] };
  if (room.combat?.order?.length) {
    room.combat = { ...room.combat, order: [...room.combat.order, placed.id] };
  }
  prepareSpawnedTokenPa(room, placed.id);

  const updated = await persistRoom(roomId, room);
  return { ok: true, snapshot: toSnapshot(updated), tokenId: token.id };
}
