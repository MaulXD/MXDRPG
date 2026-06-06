import { canEditMapMarkups, canEditRoomScene } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { sanitizeDungeonObjects } from "@/lib/vtt/dungeon-layer";
import { sanitizeMapMarkups, validatePlayerMarkupPatch } from "@/lib/vtt/map-markup";
import { revealAxial } from "@/lib/vtt/fog-of-war";
import { inGrid } from "@/lib/vtt/token-occupancy";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot } from "../types";
import type { BattleScene } from "@/lib/vtt/types";

export type ScenePatch = Partial<
  Pick<
    BattleScene,
    | "mapImageUrl"
    | "mapImageScale"
    | "mapImageOffsetX"
    | "mapImageOffsetY"
    | "fogEnabled"
    | "revealedHexes"
    | "dungeonObjects"
    | "mapMarkups"
  >
>;

export async function patchRoomScene(
  roomId: string,
  user: SessionUser | null,
  patch: ScenePatch
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const markupOnly =
    patch.mapMarkups !== undefined &&
    Object.keys(patch).every((k) => k === "mapMarkups");

  if (markupOnly) {
    if (!canEditMapMarkups(room, user)) return null;
    if (!validatePlayerMarkupPatch(room.scene.mapMarkups ?? [], patch.mapMarkups!, user, room)) {
      return null;
    }
  } else if (!canEditRoomScene(room, user)) {
    return null;
  }

  const next = { ...room.scene, ...patch };
  if (patch.dungeonObjects !== undefined) {
    next.dungeonObjects = sanitizeDungeonObjects(next);
  }
  if (patch.mapMarkups !== undefined) {
    next.mapMarkups = sanitizeMapMarkups(patch.mapMarkups);
  }
  room.scene = next;
  const updated = await persistRoom(roomId, room);
  return toSnapshot(updated);
}

export async function revealRoomHex(
  roomId: string,
  user: SessionUser | null,
  q: number,
  r: number
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;
  if (!canEditRoomScene(room, user)) return null;
  if (!inGrid({ q, r }, room.scene.gridRadius)) return null;

  room.scene = revealAxial(room.scene, { q, r });
  const updated = await persistRoom(roomId, room);
  return toSnapshot(updated);
}
