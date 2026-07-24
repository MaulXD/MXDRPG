import { characterOwnedBySessionUser } from "@/lib/auth/account-ownership";
import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { activeTokenId, type CombatTrack } from "@/lib/room/combat";
import type { RoomActor } from "@/lib/room/types";
import { isMonsterToken } from "@/lib/room/settings";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";

export type CombatTurnRoom = {
  roomId: string;
  ownerId: string;
  memberIds: string[];
  scene: BattleScene;
  actors: Record<string, RoomActor>;
};

export type CombatTurnAccessOpts = {
  /** Mestre simula visão de jogador no cliente (não altera permissões no servidor). */
  simulatePlayerView?: boolean;
  showMonsterHpToPlayers?: boolean;
};

function hasGmView(
  room: CombatTurnRoom,
  user: SessionUser | null,
  opts?: Pick<CombatTurnAccessOpts, "simulatePlayerView">
): boolean {
  return canManageRoom(room, user) && !opts?.simulatePlayerView;
}

/** Mestre vê HP de qualquer criatura; jogadores só veem PCs linkados (e aliados no hover na UI). */
export function canViewTokenHp(
  room: CombatTurnRoom,
  user: SessionUser | null,
  token: BattleToken,
  opts?: CombatTurnAccessOpts
): boolean {
  if (hasGmView(room, user, opts)) return true;
  if (token.vidaMax == null) return false;
  if (isMonsterToken(token) && !token.linked) {
    return Boolean(opts?.showMonsterHpToPlayers);
  }
  if (token.linked && !token.monsterEntryId) return true;
  return false;
}

/** Mestre vê todos os PA; jogadores só veem PA de fichas linkadas (nunca monstros). */
export function canViewTokenPa(
  room: CombatTurnRoom,
  user: SessionUser | null,
  token: BattleToken,
  opts?: Pick<CombatTurnAccessOpts, "simulatePlayerView">
): boolean {
  if (hasGmView(room, user, opts)) return true;
  if (isMonsterToken(token) && !token.linked) return false;
  if (token.linked && token.actorId) {
    if (!user) return false;
    const actor = room.actors[token.actorId];
    return actor ? characterOwnedBySessionUser(actor, user) : false;
  }
  return false;
}

export function canControlToken(
  room: CombatTurnRoom,
  user: SessionUser | null,
  token: BattleToken,
  opts?: Pick<CombatTurnAccessOpts, "simulatePlayerView">
): boolean {
  if (!user) return false;
  if (hasGmView(room, user, opts)) return true;
  if (isMonsterToken(token)) return false;
  if (token.delegatedToUserId && token.delegatedToUserId === user.id) return true;
  if (token.linked && token.actorId) {
    const actor = room.actors[token.actorId];
    return actor ? characterOwnedBySessionUser(actor, user) : false;
  }
  return false;
}

/** Mestre ou dono do token na vez. */
export function canAdvanceCombatTurn(
  room: CombatTurnRoom,
  user: SessionUser | null,
  combat: CombatTrack,
  opts?: Pick<CombatTurnAccessOpts, "simulatePlayerView">
): boolean {
  if (!combat.order?.length) return false;
  if (!user) return false;
  if (hasGmView(room, user, opts)) return true;
  const activeId = activeTokenId(combat);
  if (!activeId) return false;
  const token = room.scene.tokens.find((t) => t.id === activeId);
  if (!token) {
    return hasGmView(room, user, opts);
  }
  return canControlToken(room, user, token, opts);
}
