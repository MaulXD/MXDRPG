import * as dbRooms from "@/lib/db/rooms";
import { getRoom } from "@/lib/room/internal/registry";

/** Revisão leve para SSE/poll — não carrega scene/actors/combat inteiros. */
export async function getRoomRevision(roomId: string): Promise<number | null> {
  if (roomId === "demo") {
    return (await getRoom(roomId))?.revision ?? null;
  }
  if (dbRooms.dbEnabled()) {
    const dbRev = await dbRooms.fetchRoomRevision(roomId);
    if (dbRev != null) return dbRev;
  }
  return (await getRoom(roomId))?.revision ?? null;
}
