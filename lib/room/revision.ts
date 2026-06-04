import { getRoom } from "@/lib/room/internal/registry";

export async function getRoomRevision(roomId: string): Promise<number | null> {
  const room = await getRoom(roomId);
  return room?.revision ?? null;
}
