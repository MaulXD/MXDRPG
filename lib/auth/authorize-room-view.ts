import { tryJoinRoomWithInvite } from "@/lib/auth/invite-access";
import {
  canViewRoomServer,
  isRoomMemberResolved,
} from "@/lib/auth/room-access-server";
import { getSession } from "@/lib/auth/session";
import { joinRoomMembers } from "@/lib/room/adventure-room";
import { getRoom } from "@/lib/room/store";
import type { RoomState } from "@/lib/room/types";
import type { SessionUser } from "@/lib/auth/types";

export type RoomViewOk = { room: RoomState; user: SessionUser | null; inviteCode: string | null };
export type RoomViewFail = { status: number; error: string };

export async function requireRoomView(
  roomId: string,
  inviteCode?: string | null
): Promise<RoomViewOk | RoomViewFail> {
  let room = await getRoom(roomId);
  if (!room) return { status: 404, error: "Sala não encontrada" };

  const session = await getSession();
  const invite = inviteCode?.trim() || null;
  const user = session?.user ?? null;

  if (user && invite) {
    const joined = await tryJoinRoomWithInvite(room, user.id, invite, user.clerkId);
    if (joined) room = joined;
  }

  if (user && !(await isRoomMemberResolved(room, user.id, user.clerkId))) {
    await joinRoomMembers(roomId, user.id);
    room = (await getRoom(roomId)) ?? room;
  }

  if (!(await canViewRoomServer(room, user, invite))) {
    return { status: 403, error: "Sem acesso a esta mesa" };
  }

  return { room, user, inviteCode: invite };
}
