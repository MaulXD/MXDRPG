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

/** Não derruba mutação se o delta falhar — devolve snapshot visível ao viewer. */
export function safeMutationDeltaResponse(
  before: RoomSnapshot,
  after: RoomSnapshot,
  room: Pick<RoomState, "roomId" | "ownerId" | "memberIds" | "settings">,
  user: SessionUser | null | undefined
): RoomDelta | RoomSnapshot {
  try {
    return mutationDeltaResponse(before, after, room, user);
  } catch (e) {
    console.error("[mutationDelta] failed:", e);
    return snapshotForViewer(after, room, user);
  }
}
