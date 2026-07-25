import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { resolveCharacterAccount } from "@/lib/auth/account-user";
import { resolveTorCharacter } from "@/lib/character/um-anel/characters";
import { TOR_ADVERSARY_BY_ID } from "@/lib/character/um-anel/adversaries";
import { createTorAdversaryToken } from "@/lib/character/um-anel/adversary-token";
import { createTorPlayerTokenFromCharacter } from "@/lib/vtt/tor-player-token";
import { nextMonsterDisplayName } from "@/lib/vtt/monster-display-name";
import { resolveSpawnAnchor } from "@/lib/vtt/dungeon-layer";
import { isExplorationMode } from "@/lib/combat/mesa-mode";
import { applyExplorationPaDisplayToToken } from "@/lib/combat/exploration-pa";
import { prepareSpawnedTokenPa } from "@/lib/combat/turn-economy";
import type { Axial } from "@/lib/vtt/grid-math";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot, RoomState } from "../types";

export type TorSpawnExecuteResult =
  | { ok: true; snapshot: RoomSnapshot; tokenId: string }
  | { ok: false; error: string };

/** Dono da ficha ou mestre da aventura podem colocar o personagem no mapa. */
export async function canPlaceTorCharacterOnBoard(
  room: Pick<RoomState, "ownerId" | "memberIds">,
  sheet: { ownerId: string },
  user: SessionUser | null
): Promise<boolean> {
  if (!user) return false;
  if (canManageRoom(room, user)) return true;
  const account = await resolveCharacterAccount(user.id);
  return account.canonicalId === sheet.ownerId;
}

/** Jogador ou mestre: coloca ficha do Um Anel no mapa (move token existente ou cria um novo). */
export async function placeRoomTorCharacterOnCell(
  roomId: string,
  torCharacterId: string,
  target: Axial,
  opts?: { room?: RoomState }
): Promise<TorSpawnExecuteResult> {
  const room = opts?.room ?? (await getRoom(roomId));
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const sheet = await resolveTorCharacter(torCharacterId);
  if (!sheet) return { ok: false, error: "Ficha não encontrada" };
  if (sheet.adventureId !== (room.adventureId ?? roomId)) {
    return { ok: false, error: "Esta ficha pertence a outra aventura" };
  }

  const existing = room.scene.tokens.find((t) => t.torCombat?.torCharacterId === torCharacterId);
  if (existing) {
    const anchor = resolveSpawnAnchor(room.scene, target, { exceptTokenId: existing.id, token: existing });
    if (!anchor) {
      return { ok: false, error: "Célula bloqueada, fora do mapa ou sem espaço para o personagem" };
    }
    const tokens = room.scene.tokens.map((t) => (t.id === existing.id ? { ...t, axial: anchor } : t));
    room.scene = { ...room.scene, tokens };
    const updated = await persistRoom(roomId, room);
    return { ok: true, snapshot: toSnapshot(updated), tokenId: existing.id };
  }

  const token = createTorPlayerTokenFromCharacter(sheet, target);
  const anchor = resolveSpawnAnchor(room.scene, target, { token });
  if (!anchor) {
    return { ok: false, error: "Célula bloqueada, fora do mapa ou sem espaço para o personagem" };
  }
  let placed = anchor.q === token.axial.q && anchor.r === token.axial.r ? token : { ...token, axial: anchor };
  if (isExplorationMode(room.settings, room.combat)) {
    placed = applyExplorationPaDisplayToToken(room, placed);
  }
  room.scene = { ...room.scene, tokens: [...room.scene.tokens, placed] };
  if (room.combat?.order?.length) {
    room.combat = { ...room.combat, order: [...room.combat.order, token.id] };
  }
  prepareSpawnedTokenPa(room, token.id);

  const updated = await persistRoom(roomId, room);
  return { ok: true, snapshot: toSnapshot(updated), tokenId: token.id };
}

/** Mestre: invoca um Adversário do Um Anel no mapa (sem ficha — stat block do compêndio). */
export async function spawnRoomTorAdversary(
  roomId: string,
  adversaryId: string,
  target: Axial,
  opts?: { room?: RoomState }
): Promise<TorSpawnExecuteResult> {
  const room = opts?.room ?? (await getRoom(roomId));
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const stats = TOR_ADVERSARY_BY_ID[adversaryId];
  if (!stats) return { ok: false, error: "Adversário não encontrado no compêndio" };

  const token = createTorAdversaryToken(stats, target);
  token.name = nextMonsterDisplayName(room.scene.tokens, token.name);

  const anchor = resolveSpawnAnchor(room.scene, target, { token });
  if (!anchor) {
    return { ok: false, error: "Célula bloqueada, ocupada ou sem espaço para o adversário" };
  }
  let placed = anchor.q === token.axial.q && anchor.r === token.axial.r ? token : { ...token, axial: anchor };
  if (isExplorationMode(room.settings, room.combat)) {
    placed = applyExplorationPaDisplayToToken(room, placed);
  }
  room.scene = { ...room.scene, tokens: [...room.scene.tokens, placed] };
  if (room.combat?.order?.length) {
    room.combat = { ...room.combat, order: [...room.combat.order, token.id] };
  }
  prepareSpawnedTokenPa(room, token.id);

  const updated = await persistRoom(roomId, room);
  return { ok: true, snapshot: toSnapshot(updated), tokenId: token.id };
}
