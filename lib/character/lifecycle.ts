import "server-only";

import { getAdventure } from "@/lib/adventure/store";
import type { SessionUser } from "@/lib/auth/types";
import { fetchClerkIdForUser, fetchUserByNickname } from "@/lib/db/users";
import {
  characterNameMatchesConfirm,
  canAssignCharacterToMember,
  canDeleteCharacterSheet,
  canTransferCharacterSheet,
} from "@/lib/character/ownership";
import { resolveCharacter, saveCharacter } from "@/lib/character/characters";
import { removeCharacterFromRegistry } from "@/lib/character/character-registry";
import { characterBelongsToAdventure } from "@/lib/character/adventure-bind";
import type { CharacterSheet } from "@/lib/character/types";
import { getRoom, persistRoom } from "@/lib/room/internal/registry";
import { syncAdventureActorsForRoom } from "@/lib/room/adventure-actors";
import type { RoomState } from "@/lib/room/types";

export type CharacterLifecycleResult =
  | { ok: true; character?: CharacterSheet; roomId?: string | null }
  | { ok: false; error: string; status?: number };

function removeActorFromRoom(room: RoomState, actorId: string): boolean {
  if (!room.actors[actorId]) return false;
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
  room.revision += 1;
  room.updatedAt = Date.now();
  return true;
}

async function persistCharacterDelete(characterId: string): Promise<void> {
  removeCharacterFromRegistry(characterId);
  try {
    const { deleteCharacter } = await import("@/lib/db/characters");
    await deleteCharacter(characterId);
  } catch (e) {
    console.warn(
      "[eldarin] deleteCharacter no Postgres falhou:",
      e instanceof Error ? e.message : e
    );
  }
}

async function resolveTargetUserId(
  targetUserId?: string | null,
  targetNickname?: string | null
): Promise<{ userId: string } | { error: string }> {
  if (targetUserId?.trim()) return { userId: targetUserId.trim() };
  const nick = targetNickname?.trim();
  if (!nick) return { error: "Informe o jogador de destino" };
  const user = await fetchUserByNickname(nick);
  if (!user) return { error: "Jogador não encontrado por apelido" };
  return { userId: user.id };
}

export async function deleteCharacterSheet(
  characterId: string,
  actor: SessionUser,
  opts: { confirmName: string; roomId?: string | null }
): Promise<CharacterLifecycleResult> {
  const confirmName = opts.confirmName?.trim();
  if (!confirmName) {
    return { ok: false, error: "Digite o nome do personagem para confirmar", status: 400 };
  }

  const sheet = await resolveCharacter(characterId);
  if (!sheet) return { ok: false, error: "Ficha não encontrada", status: 404 };

  if (!characterNameMatchesConfirm(sheet.name, confirmName)) {
    return { ok: false, error: "O nome digitado não confere com o personagem", status: 400 };
  }

  const adventureId = sheet.adventureId ?? sheet.campaignRoomId ?? null;
  const adventure = adventureId ? await getAdventure(adventureId) : null;
  const roomId = opts.roomId?.trim() || adventure?.primaryRoomId || null;
  const room = roomId ? await getRoom(roomId) : null;

  if (!canDeleteCharacterSheet(sheet, actor, { adventure, room })) {
    return { ok: false, error: "Sem permissão para excluir esta ficha", status: 403 };
  }

  if (room) {
    removeActorFromRoom(room, characterId);
    await persistRoom(room.roomId, room);
  }

  await persistCharacterDelete(characterId);
  if (roomId) await syncAdventureActorsForRoom(roomId);

  return { ok: true, roomId };
}

export async function transferCharacterSheet(
  characterId: string,
  actor: SessionUser,
  opts: {
    confirmName?: string | null;
    targetUserId?: string | null;
    targetNickname?: string | null;
    roomId?: string | null;
    asGm?: boolean;
  }
): Promise<CharacterLifecycleResult> {
  const sheet = await resolveCharacter(characterId);
  if (!sheet) return { ok: false, error: "Ficha não encontrada", status: 404 };

  const adventureId = sheet.adventureId ?? sheet.campaignRoomId ?? null;
  if (!adventureId) {
    return { ok: false, error: "Ficha não está vinculada a uma aventura", status: 400 };
  }

  const adventure = await getAdventure(adventureId);
  if (!adventure) return { ok: false, error: "Aventura não encontrada", status: 404 };

  const roomId = opts.roomId?.trim() || adventure.primaryRoomId;
  const room = await getRoom(roomId);

  const asGm = Boolean(opts.asGm);
  if (!canTransferCharacterSheet(sheet, actor, { adventure, room, asGm })) {
    return { ok: false, error: "Sem permissão para transferir esta ficha", status: 403 };
  }

  const isOwner = sheet.ownerId === actor.id;
  if (!asGm && isOwner) {
    const confirmName = opts.confirmName?.trim();
    if (!confirmName) {
      return { ok: false, error: "Digite o nome do personagem para confirmar", status: 400 };
    }
    if (!characterNameMatchesConfirm(sheet.name, confirmName)) {
      return { ok: false, error: "O nome digitado não confere com o personagem", status: 400 };
    }
  }

  const targetResolved = await resolveTargetUserId(opts.targetUserId, opts.targetNickname);
  if ("error" in targetResolved) {
    return { ok: false, error: targetResolved.error, status: 400 };
  }

  const targetClerkId = await fetchClerkIdForUser(targetResolved.userId);
  if (!canAssignCharacterToMember(adventure, targetResolved.userId, targetClerkId)) {
    return { ok: false, error: "O destino não participa desta aventura", status: 400 };
  }

  if (targetResolved.userId === sheet.ownerId) {
    return { ok: false, error: "Esta ficha já pertence a esse jogador", status: 400 };
  }

  if (!characterBelongsToAdventure(sheet, adventure.adventureId)) {
    return { ok: false, error: "Ficha não pertence a esta aventura", status: 400 };
  }

  const updated = await saveCharacter({ ...sheet, ownerId: targetResolved.userId });
  await syncAdventureActorsForRoom(roomId);

  return { ok: true, character: updated, roomId };
}
