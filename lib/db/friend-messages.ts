import "server-only";

import { dbEnabled, getSql } from "@/lib/db/client";
import { isFriendLink } from "@/lib/db/friends";

export type FriendMessageRow = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: number;
};

type MessageDbRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  created_at: string | number;
};

function rowToMessage(r: MessageDbRow): FriendMessageRow {
  return {
    id: r.id,
    fromUserId: r.from_user_id,
    toUserId: r.to_user_id,
    body: r.body,
    createdAt: Number(r.created_at),
  };
}

export async function listFriendMessages(
  userId: string,
  friendId: string,
  after?: number
): Promise<FriendMessageRow[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];

  const friends = await isFriendLink(userId, friendId);
  if (!friends) return [];

  const afterTs = typeof after === "number" && Number.isFinite(after) ? after : 0;

  const rows = await sql<MessageDbRow[]>`
    SELECT id, from_user_id, to_user_id, body, created_at
    FROM eldarin_friend_messages
    WHERE (
      (from_user_id = ${userId} AND to_user_id = ${friendId})
      OR (from_user_id = ${friendId} AND to_user_id = ${userId})
    )
    AND created_at > ${afterTs}
    ORDER BY created_at ASC
    LIMIT 200
  `;

  return rows.map(rowToMessage);
}

export async function insertFriendMessage(
  fromUserId: string,
  toUserId: string,
  body: string
): Promise<FriendMessageRow | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;

  const isFriend = await isFriendLink(fromUserId, toUserId);
  if (!isFriend) return null;

  const trimmed = body.trim();
  if (!trimmed) return null;

  const id = `fmsg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();

  await sql`
    INSERT INTO eldarin_friend_messages (id, from_user_id, to_user_id, body, created_at)
    VALUES (${id}, ${fromUserId}, ${toUserId}, ${trimmed}, ${now})
  `;

  return {
    id,
    fromUserId,
    toUserId,
    body: trimmed,
    createdAt: now,
  };
}

export async function countUnreadFriendMessages(userId: string): Promise<number> {
  if (!dbEnabled()) return 0;
  const sql = getSql();
  if (!sql) return 0;

  const rows = await sql<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM eldarin_friend_messages
    WHERE to_user_id = ${userId}
      AND read_at IS NULL
  `;

  return Number(rows[0]?.count ?? 0);
}

export async function markFriendMessagesRead(
  userId: string,
  friendId: string
): Promise<number> {
  if (!dbEnabled()) return 0;
  const sql = getSql();
  if (!sql) return 0;

  const friends = await isFriendLink(userId, friendId);
  if (!friends) return 0;

  const now = Date.now();
  const rows = await sql<{ count: string }[]>`
    WITH updated AS (
      UPDATE eldarin_friend_messages
      SET read_at = ${now}
      WHERE to_user_id = ${userId}
        AND from_user_id = ${friendId}
        AND read_at IS NULL
      RETURNING 1
    )
    SELECT COUNT(*)::text AS count FROM updated
  `;

  return Number(rows[0]?.count ?? 0);
}
