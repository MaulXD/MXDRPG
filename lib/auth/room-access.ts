import { canEditCharacter } from "@/lib/character/demo-characters";
import {
  characterBelongsToAdventure,
  resolveAdventureId,
} from "@/lib/character/adventure-bind";
import type { CharacterSheet } from "@/lib/character/types";
import type { SessionUser } from "@/lib/auth/types";
import { normalizeRoomSettings, type RoomSettings } from "@/lib/room/settings";
import type { RoomState } from "@/lib/room/types";

/** PCs jogáveis na mesa demo sem login (visitante). */
export const DEMO_PLAYABLE_ACTOR_IDS = ["pc-aventureiro", "pc-aventureira-maga"] as const;
/** @deprecated Use DEMO_PLAYABLE_ACTOR_IDS */
export const DEMO_PLAYABLE_ACTOR_ID = DEMO_PLAYABLE_ACTOR_IDS[0];

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

/** Editar piso, objetos e fog — só o mestre da mesa (não jogadores da demo). */
export function canEditRoomScene(
  room: Pick<RoomState, "roomId" | "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  return canManageRoom(room, user);
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

/** Ignorar iniciativa — só o mestre (ou admin), se habilitado nas configurações da mesa. */
export function canBypassCombatTurn(
  room: Pick<RoomState, "ownerId"> & { settings?: RoomSettings | null },
  user: SessionUser | null | undefined
): boolean {
  if (!normalizeRoomSettings(room.settings).gmBypassInitiative) return false;
  if (!user) return false;
  if (user.role === "admin") return true;
  return canManageRoom(room, user);
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
  return (
    room.roomId === "demo" &&
    DEMO_PLAYABLE_ACTOR_IDS.includes(actor.id as (typeof DEMO_PLAYABLE_ACTOR_IDS)[number])
  );
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
