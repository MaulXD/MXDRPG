import { canViewTokenPa, type CombatTurnRoom } from "@/lib/auth/combat-turn-access";
import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomSnapshot, RoomState } from "@/lib/room/types";
import { filterTokensForFog, visibleHexSetForPlayer } from "@/lib/vtt/fog-of-war";
import type { BattleToken } from "@/lib/vtt/types";

function combatRoomFrom(
  room: Pick<RoomState, "roomId" | "ownerId" | "memberIds">,
  snapshot: RoomSnapshot
): CombatTurnRoom {
  return {
    roomId: room.roomId,
    ownerId: room.ownerId,
    memberIds: room.memberIds,
    scene: snapshot.scene,
    actors: snapshot.actors,
  };
}

function redactTokenPa(token: BattleToken): BattleToken {
  return {
    ...token,
    pa: 0,
    paMax: 0,
    bankedPa: undefined,
    paSpentThisTurn: undefined,
  };
}

/** Oculta PA de monstros (e tokens sem permissão) para quem não é mestre da sala. */
export function snapshotForViewer(
  snapshot: RoomSnapshot,
  room: Pick<RoomState, "roomId" | "ownerId" | "memberIds">,
  user: SessionUser | null | undefined
): RoomSnapshot {
  const isGm = canManageRoom(room, user);
  const actorIds = user
    ? Object.entries(snapshot.actors)
        .filter(([, a]) => a.ownerId === user.id)
        .map(([id]) => id)
    : [];

  const fogVisible = isGm
    ? null
    : visibleHexSetForPlayer(snapshot.scene, snapshot.scene.tokens, {
        userId: user?.id,
        actorIds,
      });

  const turnRoom = combatRoomFrom(room, snapshot);
  let tokens = snapshot.scene.tokens.map((t) =>
    canViewTokenPa(turnRoom, user ?? null, t) ? t : redactTokenPa(t)
  );

  if (fogVisible) {
    tokens = filterTokensForFog(tokens, snapshot.scene, fogVisible, {
      userId: user?.id,
      actorIds,
    });
  }

  if (
    isGm &&
    tokens.every((t, i) => t === snapshot.scene.tokens[i])
  ) {
    return snapshot;
  }

  return {
    ...snapshot,
    scene: {
      ...snapshot.scene,
      tokens,
      revealedHexes: isGm ? snapshot.scene.revealedHexes : snapshot.scene.revealedHexes,
    },
  };
}
