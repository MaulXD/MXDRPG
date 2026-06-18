import { cookies } from "next/headers";
import { canParticipateInRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";

export function mesaWatchCookieName(roomId: string): string {
  return `mesa_watch_${roomId}`;
}

export const MESA_WATCH_COOKIE_MAX_AGE = 60 * 60 * 12;

export function mesaWatchCookiePath(roomId: string): string {
  return `/mesa/${roomId}`;
}

export async function isMesaWatchOnlySession(roomId: string): Promise<boolean> {
  const jar = await cookies();
  return jar.get(mesaWatchCookieName(roomId))?.value === "1";
}

/** Participação na mesa respeitando modo só assistir (cookie setado em ?watch=1). */
export async function canParticipateInRoomSession(
  room: { roomId: string; ownerId?: string; memberIds?: string[] },
  user: SessionUser | null | undefined
): Promise<boolean> {
  if (await isMesaWatchOnlySession(room.roomId)) return false;
  return canParticipateInRoom(room, user);
}

export async function canChatInRoomSession(
  room: { roomId: string; ownerId?: string; memberIds?: string[] },
  user: SessionUser | null | undefined
): Promise<boolean> {
  return canParticipateInRoomSession(room, user);
}
