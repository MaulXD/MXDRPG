import { canViewRoom } from "@/lib/auth/room-access";
import { getSession } from "@/lib/auth/session";
import { getRoom } from "@/lib/room/store";
import type { RoomState } from "@/lib/room/types";
import type { SessionUser } from "@/lib/auth/types";

export type RoomViewOk = { room: RoomState; user: SessionUser | null; inviteCode: string | null };
export type RoomViewFail = { status: number; error: string };

export async function requireRoomView(
  roomId: string,
  inviteCode?: string | null
): Promise<RoomViewOk | RoomViewFail> {
  const room = await getRoom(roomId);
  if (!room) return { status: 404, error: "Sala não encontrada" };

  const session = await getSession();
  const invite = inviteCode?.trim() || null;

  if (!canViewRoom(room, session?.user ?? null, invite)) {
    return { status: 403, error: "Sem acesso a esta mesa" };
  }

  return { room, user: session?.user ?? null, inviteCode: invite };
}
