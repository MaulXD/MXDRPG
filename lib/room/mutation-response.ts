import type { SessionUser } from "@/lib/auth/types";
import { buildRoomDelta, type RoomDelta } from "@/lib/room/room-delta";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import type { RoomSnapshot, RoomState } from "@/lib/room/types";

/** Delta mínimo pós-mutação — visão do viewer aplicada antes/depois. */
export function mutationDeltaResponse(
  before: RoomSnapshot,
  after: RoomSnapshot,
  room: Pick<RoomState, "roomId" | "ownerId" | "memberIds" | "settings">,
  user: SessionUser | null | undefined
): RoomDelta {
  const vBefore = snapshotForViewer(before, room, user);
  const vAfter = snapshotForViewer(after, room, user);
  return buildRoomDelta(vBefore, vAfter);
}
