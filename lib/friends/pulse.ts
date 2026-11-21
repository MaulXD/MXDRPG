import { ensureDbMigrations } from "@/lib/db/ensure-migrations";
import { countUnreadFriendMessages } from "@/lib/db/friend-messages";
import { countIncomingFriendRequests, listReceivedMesaInvites } from "@/lib/friends/store";

export type FriendsPulse = {
  unread: number;
  invites: number;
  requestsCount: number;
};

/**
 * Os três contadores do chat de amigos numa leitura só.
 * Usa as mesmas consultas de /api/friends/messages/unread, /api/friends/invites
 * e /api/friends/requests?countOnly=1 (que continuam existindo para quem já as usa).
 */
export async function getFriendsPulse(userId: string): Promise<FriendsPulse> {
  await ensureDbMigrations();
  const [unread, invites, requestsCount] = await Promise.all([
    countUnreadFriendMessages(userId),
    listReceivedMesaInvites(userId),
    countIncomingFriendRequests(userId),
  ]);
  return { unread, invites: invites.length, requestsCount };
}
