import { canEditRoomActor, canPlaceRoomActorOnBoard } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomActor } from "@/lib/room/types";
import { isActorDowned, isTokenDowned } from "@/lib/vtt/player-tokens";
import type { BattleToken } from "@/lib/vtt/types";

export type ActorBoardRoomCtx = {
  roomId: string;
  adventureId: string;
  ownerId: string;
  memberIds: string[];
};

export function tokenOnBoardForActor(
  tokens: BattleToken[],
  actorId: string
): BattleToken | undefined {
  return tokens.find((t) => t.linked && t.actorId === actorId);
}

export function canDragActorToMap(
  actor: RoomActor,
  tokens: BattleToken[],
  roomCtx: ActorBoardRoomCtx,
  session: SessionUser | null,
  isRoomGm: boolean
): boolean {
  const onBoard = tokenOnBoardForActor(tokens, actor.id);
  if (onBoard && isTokenDowned(onBoard)) return false;
  if (isActorDowned(actor)) return false;
  if (isRoomGm) return true;
  return canPlaceRoomActorOnBoard(roomCtx, actor, session);
}

export function mayPullActorFromBoard(
  actor: RoomActor,
  tokens: BattleToken[],
  roomCtx: ActorBoardRoomCtx,
  session: SessionUser | null,
  isRoomGm: boolean
): boolean {
  if (!tokenOnBoardForActor(tokens, actor.id)) return false;
  if (isRoomGm) return true;
  if (!session) return false;
  return canEditRoomActor(roomCtx, actor, session);
}
