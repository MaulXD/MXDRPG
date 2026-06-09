import { canEditCharacter } from "@/lib/character/demo-characters";
import {
  characterBelongsToAdventure,
  resolveAdventureId,
} from "@/lib/character/adventure-bind";
import type { CharacterSheet } from "@/lib/character/types";
import type { SessionUser } from "@/lib/auth/types";
import { normalizeRoomSettings, type RoomSettings } from "@/lib/room/settings";
import { memberIdsHasUser } from "@/lib/auth/member-ids";
import type { RoomState } from "@/lib/room/types";

/** PCs jogáveis na mesa demo sem login (visitante). */
export const DEMO_PLAYABLE_ACTOR_IDS = [
  "pc-thrain-ferroescudo",
  "pc-lyanna-umbral",
  "pc-maelis-purificador",
  "pc-pippin-sussurro",
] as const;
/** @deprecated Use DEMO_PLAYABLE_ACTOR_IDS */
export const DEMO_PLAYABLE_ACTOR_ID = DEMO_PLAYABLE_ACTOR_IDS[0];

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function inviteMatches(
  room: Pick<RoomState, "inviteCode">,
  code: string | null | undefined,
  adventureInviteCode?: string | null
): boolean {
  if (!code?.trim()) return false;
  const norm = normalizeInviteCode(code);
  if (normalizeInviteCode(room.inviteCode) === norm) return true;
  if (adventureInviteCode && normalizeInviteCode(adventureInviteCode) === norm) return true;
  return false;
}

/** Criador da mesa = “mestre” só nesta sala (modelo Roll20) */
export function isRoomOwner(
  room: { ownerId?: string | null },
  userId: string | undefined
): boolean {
  if (!userId || !room.ownerId) return false;
  return room.ownerId === userId;
}

export function isRoomMember(
  room: Pick<RoomState, "roomId"> & { ownerId?: string; memberIds?: string[] },
  userId: string | undefined,
  clerkId?: string | null
): boolean {
  if (!userId) return false;
  if (isRoomOwner(room, userId)) return true;
  return memberIdsHasUser(room.memberIds ?? [], userId, clerkId);
}

export function canManageRoom(
  room: Pick<RoomState, "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return isRoomOwner(room, user.id);
}

/** Aplicar/remover condições de status (Cap. 3.4) — só o mestre da mesa. */
export function canApplyTokenConditions(
  room: Pick<RoomState, "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  return canManageRoom(room, user);
}

/** Editar piso, objetos e fog — só o mestre da mesa (não jogadores da demo). */
export function canEditRoomScene(
  room: Pick<RoomState, "roomId" | "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  return canManageRoom(room, user);
}

/** Identificador estável do autor numa marcação da lousa. */
export function mapMarkupAuthorId(user: SessionUser | null | undefined): string {
  if (!user) return "visitante";
  return user.id;
}

/** Desenhar na lousa — qualquer participante da mesa (estilo Roll20). */
export function canEditMapMarkups(
  room: RoomState,
  user: SessionUser | null | undefined
): boolean {
  return canParticipateInRoom(room, user);
}

/** Limpar toda a lousa ou marcações permanentes alheias — só mestre. */
export function canManageAllMapMarkups(
  room: Pick<RoomState, "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  return canManageRoom(room, user);
}

export function canDeleteMapMarkup(
  markup: { author: string },
  room: Pick<RoomState, "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  if (canManageRoom(room, user)) return true;
  if (!user) return false;
  const mine = mapMarkupAuthorId(user);
  return markup.author === mine || markup.author === user.name || markup.author === user.email;
}

/** Ver mapa + chat leitura (demo, membro, admin, ou código convite na URL). */
export function canViewRoom(
  room: RoomState,
  user: SessionUser | null | undefined,
  inviteCode?: string | null,
  adventureInviteCode?: string | null
): boolean {
  if (room.roomId === "demo") return true;
  if (user?.role === "admin") return true;
  if (user && isRoomMember(room, user.id, user.clerkId)) return true;
  if (inviteMatches(room, inviteCode, adventureInviteCode)) return true;
  return false;
}

/** Logado com convite mas ainda não entrou na mesa — só espectador até join. */
export function isRoomVisitor(
  room: RoomState,
  user: SessionUser | null | undefined,
  inviteCode?: string | null,
  adventureInviteCode?: string | null
): boolean {
  if (!canViewRoom(room, user, inviteCode, adventureInviteCode)) return false;
  if (room.roomId === "demo") return !user;
  if (!user) return inviteMatches(room, inviteCode, adventureInviteCode);
  if (user.role === "admin" || isRoomMember(room, user.id, user.clerkId)) return false;
  return inviteMatches(room, inviteCode, adventureInviteCode);
}

/** Editar tokens, combate, chat, dados — membro da mesa (demo: exige login). */
export function canParticipateInRoom(
  room: Pick<RoomState, "roomId"> & { ownerId?: string; memberIds?: string[] },
  user: SessionUser | null | undefined
): boolean {
  if (room.roomId === "demo") return Boolean(user);
  if (!user) return false;
  if (user.role === "admin") return true;
  return isRoomMember(room, user.id, user.clerkId);
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

/**
 * Bypass de ações fora do turno — desativado.
 * O mestre ainda gerencia a fila via `canAdvanceCombatTurn` (passar turno, iniciativa, reordenar).
 */
export function canBypassCombatTurn(
  _room: Pick<RoomState, "ownerId"> & { settings?: RoomSettings | null },
  _user: SessionUser | null | undefined
): boolean {
  return false;
}

/** Retirar token do mapa — mestre (qualquer token) ou dono da ficha linkada. */
export function canRemoveTokenFromBoard(
  room: RoomState,
  user: SessionUser | null | undefined,
  token: import("@/lib/vtt/types").BattleToken
): boolean {
  if (canSpawnMonstersInRoom(room, user)) return true;
  if (!user || !canParticipateInRoom(room, user)) return false;
  if (!token.linked || !token.actorId) return false;
  const actor = room.actors[token.actorId];
  if (!actor) return false;
  return canEditRoomActor(room, actor, user);
}

/** Arrastar token livremente no mapa (sem PA nem turno) — só o mestre da mesa. */
export function canRepositionTokensInRoom(
  room: Pick<RoomState, "roomId" | "ownerId">,
  user: SessionUser | null | undefined
): boolean {
  return canManageRoom(room, user);
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

type RoomAuthContext = Pick<RoomState, "roomId"> & {
  adventureId?: string;
  ownerId?: string;
  memberIds?: string[];
};

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

/** Colocar ou mover token de personagem no mapa — dono da ficha ou mestre da mesa. */
export function canPlaceRoomActorOnBoard(
  room: Pick<RoomState, "roomId" | "ownerId"> & { adventureId?: string },
  actor: Pick<CharacterSheet, "id" | "ownerId" | "adventureId" | "campaignRoomId">,
  user: SessionUser | null | undefined
): boolean {
  if (canEditRoomActor(room, actor, user)) return true;
  if (!user || !canParticipateInRoom(room, user)) return false;
  const adventureId = room.adventureId ?? room.roomId;
  const authActor = actorForRoomAuth(room, actor);
  if (!characterBelongsToAdventure(authActor, adventureId)) return false;
  return canManageRoom(room, user);
}

/** Editar ficha na mesa (level-up, identidade, retrato) — alinhado a `canParticipateInRoom`. */
export function canEditRoomActor(
  room: RoomAuthContext,
  actor: Pick<CharacterSheet, "id" | "ownerId" | "adventureId" | "campaignRoomId">,
  user: SessionUser | null | undefined
): boolean {
  if (!canParticipateInRoom(room, user)) return false;
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
