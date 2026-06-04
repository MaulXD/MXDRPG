import { canParticipateInRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { inGrid } from "@/lib/vtt/token-occupancy";
import { createPing, prunePings, PING_MAX_ACTIVE } from "@/lib/vtt/ping";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot } from "../types";

export async function addRoomPing(
  roomId: string,
  user: SessionUser | null,
  q: number,
  r: number,
  color: string
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;
  if (!canParticipateInRoom(room, user)) return null;
  if (!inGrid({ q, r }, room.scene.gridRadius)) return null;

  const author = user?.nickname?.trim() || user?.name?.trim() || "Jogador";
  const pings = prunePings([...(room.pings ?? []), createPing(q, r, author, color)]).slice(
    -PING_MAX_ACTIVE
  );

  room.pings = pings;
  const updated = await persistRoom(roomId, room);
  return toSnapshot(updated);
}
