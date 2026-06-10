import "server-only";

import { getAdventure } from "@/lib/adventure/store";
import { isAdventurePublic } from "@/lib/adventure/access";
import { isRoomMember } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import type { RoomState } from "@/lib/room/types";

/** Mesas públicas permitem auto-join; fechadas exigem convite, senha ou aprovação. */
export async function shouldAutoJoinRoom(
  room: RoomState,
  user: SessionUser
): Promise<boolean> {
  if (room.roomId === "demo") return true;
  if (user.role === "admin") return true;
  if (isRoomMember(room, user.id, user.clerkId)) return false;

  const adventureId = room.adventureId ?? room.roomId;
  const adv = await getAdventure(adventureId);
  if (!adv) return true;
  if (adv.ownerId === user.id) return true;
  return isAdventurePublic(adv);
}
