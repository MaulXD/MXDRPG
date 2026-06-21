import type { SessionUser } from "@/lib/auth/types";
import { buildRoomDelta, type RoomDelta } from "@/lib/room/room-delta";
import { snapshotForViewer } from "@/lib/room/snapshot-for-viewer";
import { trimSnapshotForSync } from "@/lib/room/snapshot-trim";
import { getSnapshotAtRevision } from "@/lib/room/revision-journal";
import { toSnapshot } from "@/lib/room/internal/registry";
import type { RoomSnapshot, RoomState } from "@/lib/room/types";

export type RoomSyncMode = "unchanged" | "full" | "delta";

export type RoomSyncResult =
  | { mode: "unchanged"; revision: number }
  | { mode: "full"; snapshot: RoomSnapshot; revision: number }
  | { mode: "delta"; delta: RoomDelta; revision: number };

type RoomCtx = Pick<RoomState, "roomId" | "ownerId" | "memberIds" | "settings">;

function viewerSnapshot(
  snapshot: RoomSnapshot,
  room: RoomCtx,
  user: SessionUser | null | undefined
): RoomSnapshot {
  const viewed = snapshotForViewer(snapshot, room, user);
  return trimSnapshotForSync(viewed, { user, room });
}

/** Delta visível ao viewer entre duas revisions canonicas. */
export function buildViewerSyncDelta(
  before: RoomSnapshot,
  after: RoomSnapshot,
  room: RoomCtx,
  user: SessionUser | null | undefined
): RoomDelta {
  const vBefore = viewerSnapshot(before, room, user);
  const vAfter = viewerSnapshot(after, room, user);
  return buildRoomDelta(vBefore, vAfter);
}

/** Resolve payload de sync GET/SSE a partir de `sinceRev`. */
export function resolveRoomSync(
  room: RoomState,
  sinceRev: number,
  user: SessionUser | null | undefined
): RoomSyncResult {
  const current = toSnapshot(room);
  const revision = current.revision;

  if (sinceRev > 0 && revision <= sinceRev) {
    return { mode: "unchanged", revision };
  }

  if (sinceRev <= 0) {
    return {
      mode: "full",
      snapshot: viewerSnapshot(current, room, user),
      revision,
    };
  }

  const before = getSnapshotAtRevision(room.roomId, sinceRev);
  if (!before) {
    return {
      mode: "full",
      snapshot: viewerSnapshot(current, room, user),
      revision,
    };
  }

  return {
    mode: "delta",
    delta: buildViewerSyncDelta(before, current, room, user),
    revision,
  };
}
