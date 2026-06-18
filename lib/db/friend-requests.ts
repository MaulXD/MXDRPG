import "server-only";

import { dbEnabled, getSql } from "@/lib/db/client";
import { countSelectExpr } from "@/lib/db/count-expr";
import { sqlAffected } from "@/lib/db/sql-helpers";

export type FriendRequestStatus = "pending" | "accepted" | "rejected";

type FriendRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: FriendRequestStatus;
  created_at: string | number;
  responded_at: string | number | null;
};

export async function insertFriendRequest(row: {
  id: string;
  fromUserId: string;
  toUserId: string;
}): Promise<void> {
  if (!dbEnabled() || row.fromUserId === row.toUserId) return;
  const sql = getSql();
  if (!sql) return;
  const now = Date.now();
  await sql`
    INSERT INTO eldarin_friend_requests (id, from_user_id, to_user_id, status, created_at)
    VALUES (${row.id}, ${row.fromUserId}, ${row.toUserId}, 'pending', ${now})
  `;
}

export async function findPendingFriendRequest(
  fromUserId: string,
  toUserId: string
): Promise<FriendRequestRow | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<FriendRequestRow[]>`
    SELECT id, from_user_id, to_user_id, status, created_at, responded_at
    FROM eldarin_friend_requests
    WHERE from_user_id = ${fromUserId}
      AND to_user_id = ${toUserId}
      AND status = 'pending'
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getFriendRequestById(requestId: string): Promise<FriendRequestRow | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<FriendRequestRow[]>`
    SELECT id, from_user_id, to_user_id, status, created_at, responded_at
    FROM eldarin_friend_requests
    WHERE id = ${requestId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function listPendingFriendRequestsForUser(
  userId: string,
  direction: "incoming" | "outgoing"
): Promise<FriendRequestRow[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  if (direction === "incoming") {
    return sql<FriendRequestRow[]>`
      SELECT id, from_user_id, to_user_id, status, created_at, responded_at
      FROM eldarin_friend_requests
      WHERE to_user_id = ${userId} AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 50
    `;
  }
  return sql<FriendRequestRow[]>`
    SELECT id, from_user_id, to_user_id, status, created_at, responded_at
    FROM eldarin_friend_requests
    WHERE from_user_id = ${userId} AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 50
  `;
}

export async function countPendingIncomingFriendRequests(userId: string): Promise<number> {
  if (!dbEnabled()) return 0;
  const sql = getSql();
  if (!sql) return 0;
  const countExpr = countSelectExpr();
  const rows = await sql.unsafe(
    `SELECT ${countExpr} AS count
     FROM eldarin_friend_requests
     WHERE to_user_id = ? AND status = 'pending'`,
    [userId]
  ) as { count: string }[];
  return Number(rows[0]?.count ?? 0);
}

export async function resolveFriendRequest(
  requestId: string,
  status: Exclude<FriendRequestStatus, "pending">
): Promise<boolean> {
  if (!dbEnabled()) return false;
  const sql = getSql();
  if (!sql) return false;
  const now = Date.now();
  const n = await sqlAffected(
    sql,
    `UPDATE eldarin_friend_requests
     SET status = ?, responded_at = ?
     WHERE id = ? AND status = 'pending'`,
    [status, now, requestId]
  );
  return n > 0;
}
