import { canManageRoom, canParticipateInRoom } from "@/lib/auth/room-access";
import { isRoomMemberResolved } from "@/lib/auth/room-access-server";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomState } from "@/lib/room/types";

/** Quem envia heartbeat e aparece no menu Online (mestre + jogadores). */
export async function canTrackRoomPresence(
  room: Pick<RoomState, "roomId" | "ownerId" | "memberIds">,
  user: SessionUser | null | undefined
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (canManageRoom(room, user)) return true;
  if (canParticipateInRoom(room, user)) return true;
  return isRoomMemberResolved(room, user.id, user.clerkId);
}
