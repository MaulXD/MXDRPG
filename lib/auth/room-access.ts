import { canEditCharacter } from "@/lib/character/demo-characters";
import {
  characterBelongsToAdventure,
  resolveAdventureId,
} from "@/lib/character/adventure-bind";
import type { CharacterSheet } from "@/lib/character/types";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomState } from "@/lib/room/types";

/** PC jogável na mesa demo sem login (visitante). */
export const DEMO_PLAYABLE_ACTOR_ID = "pc-aventureiro";

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function inviteMatches(room: RoomState, code: string | null | undefined): boolean {
  if (!code?.trim()) return false;
  return normalizeInviteCode(room.inviteCode) === normalizeInviteCode(code);
}

/** Criador da mesa = “mestre” só nesta sala (modelo Roll20) */
export function isRoomOwner(room: Pick<RoomState, "ownerId">, userId: string | undefined): boolean {
  if (!userId) return false;
  return room.ownerId === userId;
}

export function isRoomMember(room: RoomState, userId: string | undefined): boolean {
  if (!userId) return false;
  if (isRoomOwner(room, userId)) return true;
  return room.memberIds.includes(userId);
}

export function canManageRoom(
  room: Pick<RoomState, "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return isRoomOwner(room, user.id);
}

/** Ver mapa + chat leitura (demo, membro, admin, ou código convite na URL). */
export function canViewRoom(
  room: RoomState,
  user: SessionUser | null | undefined,
  inviteCode?: string | null
): boolean {
  if (room.roomId === "demo") return true;
  if (user?.role === "admin") return true;
  if (user && isRoomMember(room, user.id)) return true;
  if (inviteMatches(room, inviteCode)) return true;
  return false;
}

/** Logado com convite mas ainda não entrou na mesa — só espectador até join. */
export function isRoomVisitor(
  room: RoomState,
  user: SessionUser | null | undefined,
  inviteCode?: string | null
): boolean {
  if (!canViewRoom(room, user, inviteCode)) return false;
  if (room.roomId === "demo") return !user;
  if (!user) return inviteMatches(room, inviteCode);
  if (user.role === "admin" || isRoomMember(room, user.id)) return false;
  return inviteMatches(room, inviteCode);
}

/** Editar tokens, combate, chat, dados — membro da mesa (demo: qualquer logado). */
export function canParticipateInRoom(
  room: RoomState,
  user: SessionUser | null | undefined
): boolean {
  if (room.roomId === "demo") return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  return isRoomMember(room, user.id);
}

/** @deprecated Use canParticipateInRoom — mantido para rotas existentes */
export function canAccessRoom(
  room: RoomState,
  user: SessionUser | null | undefined
): boolean {
  return canParticipateInRoom(room, user);
}

export function canChatInRoom(
  room: RoomState,
  user: SessionUser | null | undefined
): boolean {
  return canParticipateInRoom(room, user);
}

/** Ignorar iniciativa em ataque/movimento (mestre na sala; demo: qualquer participante). */
export function canBypassCombatTurn(
  room: Pick<RoomState, "roomId" | "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  return canSpawnMonstersInRoom(room, user);
}

/** Reposicionar token livremente no mapa (mestre / demo GM). */
export function canRepositionTokensInRoom(
  room: Pick<RoomState, "roomId" | "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  return canBypassCombatTurn(room, user);
}

/** Invocar monstros no tabuleiro (mesma regra que controle de combate na demo). */
export function canSpawnMonstersInRoom(
  room: Pick<RoomState, "roomId" | "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  if (room.roomId === "demo") return true;
  if (!user) return false;
  if (user.role === "admin") return true;
  return canManageRoom(room, user);
}

type RoomAuthContext = Pick<RoomState, "roomId"> & { adventureId?: string };

/** Vínculo de aventura para checagem na mesa (preenche legado sem adventureId). */
export function actorForRoomAuth(
  room: RoomAuthContext,
  actor: Pick<CharacterSheet, "id" | "ownerId" | "adventureId" | "campaignRoomId">
): Pick<CharacterSheet, "id" | "ownerId" | "adventureId" | "campaignRoomId"> {
  const roomAdventureId = room.adventureId ?? room.roomId;
  return {
    ...actor,
    adventureId: resolveAdventureId(actor) ?? roomAdventureId,
    campaignRoomId: actor.campaignRoomId ?? room.roomId,
  };
}

/** Editar ficha na mesa (level-up, identidade, retrato) — alinhado a `canParticipateInRoom`. */
export function canEditRoomActor(
  room: RoomAuthContext,
  actor: Pick<CharacterSheet, "id" | "ownerId" | "adventureId" | "campaignRoomId">,
  user: SessionUser | null | undefined
): boolean {
  if (!canParticipateInRoom(room as RoomState, user)) return false;
  const adventureId = room.adventureId ?? room.roomId;
  const authActor = actorForRoomAuth(room, actor);
  if (!characterBelongsToAdventure(authActor, adventureId)) return false;
  if (user) return canEditCharacter(authActor as CharacterSheet, user.id, user.role);
  return room.roomId === "demo" && actor.id === DEMO_PLAYABLE_ACTOR_ID;
}

export function canViewMonsterCompendium(
  room: RoomState,
  user: SessionUser | null | undefined
): boolean {
  return canManageRoom(room, user);
}

export function roomInviteUrl(roomId: string, inviteCode: string, basePath?: string): string {
  const origin =
    basePath ??
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : "");
  const path = `/mesa/${roomId}?invite=${encodeURIComponent(inviteCode)}`;
  return origin ? `${origin}${path}` : path;
}
