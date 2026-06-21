import * as dbRooms from "@/lib/db/rooms";
import { getRoom } from "@/lib/room/internal/registry";
import { readCachedRevision, writeCachedRevision } from "@/lib/room/revision-cache";

/** Revisão leve para SSE/poll — não carrega scene/actors/combat inteiros. */
export async function getRoomRevision(roomId: string): Promise<number | null> {
  if (roomId === "demo") {
    return (await getRoom(roomId, { skipAutoPass: true }))?.revision ?? null;
  }

  const cached = readCachedRevision(roomId);
  if (cached != null) return cached;

  if (dbRooms.dbEnabled()) {
    const dbRev = await dbRooms.fetchRoomRevision(roomId);
    if (dbRev != null) {
      writeCachedRevision(roomId, dbRev);
      return dbRev;
    }
  }

  const memRev = (await getRoom(roomId, { skipAutoPass: true }))?.revision ?? null;
  if (memRev != null) writeCachedRevision(roomId, memRev);
  return memRev;
}
