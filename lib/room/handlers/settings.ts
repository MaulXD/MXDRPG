import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { normalizeRoomSettings, type RoomSettings } from "@/lib/room/settings";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot } from "../types";

export type RoomSettingsPatch = Partial<RoomSettings> & {
  name?: string;
};

export async function patchRoomSettings(
  roomId: string,
  user: SessionUser | null,
  patch: RoomSettingsPatch
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;
  if (!canManageRoom(room, user)) return null;

  if (typeof patch.name === "string") {
    const label = patch.name.trim().slice(0, 80);
    if (label) {
      room.name = label;
      room.scene = { ...room.scene, name: label };
    }
  }

  const current = normalizeRoomSettings(room.settings);
  room.settings = normalizeRoomSettings({
    ...current,
    ...patch,
  });

  const updated = await persistRoom(roomId, room);
  return toSnapshot(updated);
}
