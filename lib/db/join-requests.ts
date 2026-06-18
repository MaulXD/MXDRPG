import "server-only";

import { dbEnabled, getSql } from "@/lib/db/client";
import { sqlAffected } from "@/lib/db/sql-helpers";

export type JoinRequestStatus = "pending" | "approved" | "rejected";

export type JoinRequestRow = {
  id: string;
  adventure_id: string;
  room_id: string;
  user_id: string;
  message: string | null;
  status: JoinRequestStatus;
  created_at: string | number;
  responded_at: string | number | null;
  responded_by: string | null;
};

export async function insertJoinRequest(row: {
  id: string;
  adventureId: string;
  roomId: string;
  userId: string;
  message?: string | null;
}): Promise<void> {
  if (!dbEnabled()) return;
  const sql = getSql();
  if (!sql) return;
  const now = Date.now();
  await sql`
    INSERT INTO eldarin_adventure_join_requests (
      id, adventure_id, room_id, user_id, message, status, created_at
    ) VALUES (
      ${row.id}, ${row.adventureId}, ${row.roomId}, ${row.userId},
      ${row.message?.trim() || null}, 'pending', ${now}
    )
  `;
}

export async function findPendingJoinRequest(
  adventureId: string,
  userId: string
): Promise<JoinRequestRow | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<JoinRequestRow[]>`
    SELECT id, adventure_id, room_id, user_id, message, status, created_at, responded_at, responded_by
    FROM eldarin_adventure_join_requests
    WHERE adventure_id = ${adventureId} AND user_id = ${userId} AND status = 'pending'
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getJoinRequestById(requestId: string): Promise<JoinRequestRow | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<JoinRequestRow[]>`
    SELECT id, adventure_id, room_id, user_id, message, status, created_at, responded_at, responded_by
    FROM eldarin_adventure_join_requests
    WHERE id = ${requestId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function listPendingJoinRequestsForAdventure(
  adventureId: string
): Promise<JoinRequestRow[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  return sql<JoinRequestRow[]>`
    SELECT id, adventure_id, room_id, user_id, message, status, created_at, responded_at, responded_by
    FROM eldarin_adventure_join_requests
    WHERE adventure_id = ${adventureId} AND status = 'pending'
    ORDER BY created_at ASC
  `;
}

export async function listPendingJoinRequestsForOwner(
  ownerId: string
): Promise<JoinRequestRow[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  return sql<JoinRequestRow[]>`
    SELECT jr.id, jr.adventure_id, jr.room_id, jr.user_id, jr.message, jr.status,
           jr.created_at, jr.responded_at, jr.responded_by
    FROM eldarin_adventure_join_requests jr
    INNER JOIN eldarin_adventures a ON a.adventure_id = jr.adventure_id
    WHERE a.owner_id = ${ownerId} AND jr.status = 'pending'
    ORDER BY jr.created_at DESC
    LIMIT 50
  `;
}

export async function resolveJoinRequest(
  requestId: string,
  status: Exclude<JoinRequestStatus, "pending">,
  respondedBy: string
): Promise<boolean> {
  if (!dbEnabled()) return false;
  const sql = getSql();
  if (!sql) return false;
  const now = Date.now();
  const n = await sqlAffected(
    sql,
    `UPDATE eldarin_adventure_join_requests
     SET status = ?, responded_at = ?, responded_by = ?
     WHERE id = ? AND status = 'pending'`,
    [status, now, respondedBy, requestId]
  );
  return n > 0;
}
