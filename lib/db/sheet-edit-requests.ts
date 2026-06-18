import "server-only";

import { dbEnabled, getSql } from "@/lib/db/client";
import { sqlAffected } from "@/lib/db/sql-helpers";
import {
  newSheetEditRequestId,
  type SheetEditRequest,
  type SheetEditRequestStatus,
  type SheetEditScope,
} from "@/lib/character/sheet-edit-request";

type Row = {
  id: string;
  character_id: string;
  adventure_id: string;
  room_id: string | null;
  requester_user_id: string;
  scope: SheetEditScope;
  status: SheetEditRequestStatus;
  gm_user_id: string | null;
  resolved_at: string | number | null;
  created_at: string | number;
  updated_at: string | number;
};

function rowToRequest(row: Row): SheetEditRequest {
  return {
    id: row.id,
    characterId: row.character_id,
    adventureId: row.adventure_id,
    roomId: row.room_id,
    requesterUserId: row.requester_user_id,
    scope: row.scope,
    status: row.status,
    gmUserId: row.gm_user_id,
    resolvedAt: row.resolved_at != null ? Number(row.resolved_at) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function fetchSheetEditRequest(id: string): Promise<SheetEditRequest | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT * FROM eldarin_sheet_edit_requests WHERE id = ${id} LIMIT 1
  `;
  const row = rows[0];
  return row ? rowToRequest(row) : null;
}

export async function fetchPendingRequestForCharacter(
  characterId: string
): Promise<SheetEditRequest | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT * FROM eldarin_sheet_edit_requests
    WHERE character_id = ${characterId} AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const row = rows[0];
  return row ? rowToRequest(row) : null;
}

export async function fetchActiveRequestForCharacter(
  characterId: string,
  requesterUserId: string
): Promise<SheetEditRequest | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT * FROM eldarin_sheet_edit_requests
    WHERE character_id = ${characterId}
      AND requester_user_id = ${requesterUserId}
      AND status IN ('pending', 'approved', 'rejected')
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  const row = rows[0];
  return row ? rowToRequest(row) : null;
}

export async function listPendingRequestsForAdventure(
  adventureId: string
): Promise<SheetEditRequest[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT * FROM eldarin_sheet_edit_requests
    WHERE adventure_id = ${adventureId} AND status = 'pending'
    ORDER BY created_at ASC
  `;
  return rows.map(rowToRequest);
}

export async function insertSheetEditRequest(input: {
  characterId: string;
  adventureId: string;
  roomId?: string | null;
  requesterUserId: string;
  scope: SheetEditScope;
}): Promise<SheetEditRequest | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;

  const existing = await fetchPendingRequestForCharacter(input.characterId);
  if (existing) return existing;

  const now = Date.now();
  const id = newSheetEditRequestId();

  await sql.unsafe(
    `INSERT INTO eldarin_sheet_edit_requests (
      id, character_id, adventure_id, room_id, requester_user_id,
      scope, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      id,
      input.characterId,
      input.adventureId,
      input.roomId ?? null,
      input.requesterUserId,
      input.scope,
      now,
      now,
    ]
  );
  return fetchSheetEditRequest(id);
}

export async function resolveSheetEditRequest(
  requestId: string,
  action: "approve" | "reject",
  gmUserId: string
): Promise<SheetEditRequest | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;

  const status: SheetEditRequestStatus = action === "approve" ? "approved" : "rejected";
  const now = Date.now();

  const n = await sqlAffected(
    sql,
    `UPDATE eldarin_sheet_edit_requests
     SET status = ?, gm_user_id = ?, resolved_at = ?, updated_at = ?
     WHERE id = ? AND status = 'pending'`,
    [status, gmUserId, now, now, requestId]
  );
  if (n === 0) return null;
  return fetchSheetEditRequest(requestId);
}

export async function listActiveRequestsForUser(
  adventureId: string,
  requesterUserId: string
): Promise<SheetEditRequest[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT * FROM eldarin_sheet_edit_requests
    WHERE adventure_id = ${adventureId}
      AND requester_user_id = ${requesterUserId}
      AND status IN ('pending', 'approved', 'rejected')
    ORDER BY updated_at DESC
  `;
  return rows.map(rowToRequest);
}

export async function dismissRejectedSheetEditRequest(requestId: string): Promise<boolean> {
  if (!dbEnabled()) return false;
  const sql = getSql();
  if (!sql) return false;
  const now = Date.now();
  const n = await sqlAffected(
    sql,
    `UPDATE eldarin_sheet_edit_requests
     SET status = 'consumed', updated_at = ?
     WHERE id = ? AND status = 'rejected'`,
    [now, requestId]
  );
  return n > 0;
}

export async function consumeSheetEditRequest(requestId: string): Promise<boolean> {
  if (!dbEnabled()) return false;
  const sql = getSql();
  if (!sql) return false;
  const now = Date.now();
  const n = await sqlAffected(
    sql,
    `UPDATE eldarin_sheet_edit_requests
     SET status = 'consumed', updated_at = ?
     WHERE id = ? AND status = 'approved'`,
    [now, requestId]
  );
  return n > 0;
}
