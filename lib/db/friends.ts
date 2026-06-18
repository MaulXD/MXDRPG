import "server-only";

import { dbEnabled, getSql } from "@/lib/db/client";
import { sqlAffected } from "@/lib/db/sql-helpers";

type FriendRow = {
  friend_id: string;
  created_at: string | number;
};

type MesaInviteRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  room_id: string;
  adventure_id: string;
  invite_code: string;
  room_name: string;
  message: string | null;
  created_at: string | number;
  dismissed_at: string | number | null;
};

export async function insertFriendLink(userId: string, friendId: string): Promise<void> {
  if (!dbEnabled() || userId === friendId) return;
  const sql = getSql();
  if (!sql) return;
  const now = Date.now();
  await sql.unsafe(
    `INSERT IGNORE INTO eldarin_user_friends (user_id, friend_id, created_at) VALUES (?, ?, ?)`,
    [userId, friendId, now]
  );
}

export async function deleteFriendLink(userId: string, friendId: string): Promise<boolean> {
  if (!dbEnabled()) return false;
  const sql = getSql();
  if (!sql) return false;
  const n = await sqlAffected(
    sql,
    `DELETE FROM eldarin_user_friends WHERE user_id = ? AND friend_id = ?`,
    [userId, friendId]
  );
  return n > 0;
}

export async function listFriendIds(userId: string): Promise<{ friendId: string; addedAt: number }[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql<FriendRow[]>`
    SELECT friend_id, created_at
    FROM eldarin_user_friends
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    friendId: r.friend_id,
    addedAt: Number(r.created_at),
  }));
}

export async function isFriendLink(userId: string, friendId: string): Promise<boolean> {
  if (!dbEnabled()) return false;
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql<{ ok: number }[]>`
    SELECT 1 AS ok FROM eldarin_user_friends
    WHERE user_id = ${userId} AND friend_id = ${friendId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function insertMesaInvite(row: {
  id: string;
  fromUserId: string;
  toUserId: string;
  roomId: string;
  adventureId: string;
  inviteCode: string;
  roomName: string;
  message?: string | null;
}): Promise<void> {
  if (!dbEnabled()) return;
  const sql = getSql();
  if (!sql) return;
  const now = Date.now();
  await sql`
    INSERT INTO eldarin_mesa_invites (
      id, from_user_id, to_user_id, room_id, adventure_id, invite_code, room_name, message, created_at
    )
    VALUES (
      ${row.id},
      ${row.fromUserId},
      ${row.toUserId},
      ${row.roomId},
      ${row.adventureId},
      ${row.inviteCode},
      ${row.roomName},
      ${row.message?.trim() || null},
      ${now}
    )
  `;
}

export async function listPendingMesaInvitesForUser(
  userId: string
): Promise<MesaInviteRow[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  return sql<MesaInviteRow[]>`
    SELECT id, from_user_id, to_user_id, room_id, adventure_id, invite_code, room_name, message, created_at, dismissed_at
    FROM eldarin_mesa_invites
    WHERE to_user_id = ${userId} AND dismissed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 50
  `;
}

export async function dismissMesaInvite(inviteId: string, userId: string): Promise<boolean> {
  if (!dbEnabled()) return false;
  const sql = getSql();
  if (!sql) return false;
  const now = Date.now();
  const n = await sqlAffected(
    sql,
    `UPDATE eldarin_mesa_invites SET dismissed_at = ? WHERE id = ? AND to_user_id = ? AND dismissed_at IS NULL`,
    [now, inviteId, userId]
  );
  return n > 0;
}
