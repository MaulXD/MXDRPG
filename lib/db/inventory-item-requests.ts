import "server-only";

import { dbEnabled, getSql } from "@/lib/db/client";
import { sqlAffected } from "@/lib/db/sql-helpers";
import {
  newInventoryItemRequestId,
  type InventoryItemRequest,
  type InventoryItemRequestStatus,
} from "@/lib/character/inventory-item-request";

type Row = {
  id: string;
  character_id: string;
  adventure_id: string;
  room_id: string | null;
  requester_user_id: string;
  pack_id: string;
  entry_id: string;
  quantity: number;
  merge_existing: boolean;
  instance_id: string | null;
  item_label: string;
  status: InventoryItemRequestStatus;
  gm_user_id: string | null;
  resolved_at: string | number | null;
  created_at: string | number;
  updated_at: string | number;
};

function rowToRequest(row: Row): InventoryItemRequest {
  return {
    id: row.id,
    characterId: row.character_id,
    adventureId: row.adventure_id,
    roomId: row.room_id,
    requesterUserId: row.requester_user_id,
    packId: row.pack_id,
    entryId: row.entry_id,
    quantity: Number(row.quantity),
    mergeExisting: Boolean(row.merge_existing),
    instanceId: row.instance_id,
    itemLabel: row.item_label,
    status: row.status,
    gmUserId: row.gm_user_id,
    resolvedAt: row.resolved_at != null ? Number(row.resolved_at) : null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export async function fetchInventoryItemRequest(id: string): Promise<InventoryItemRequest | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT * FROM eldarin_inventory_item_requests WHERE id = ${id} LIMIT 1
  `;
  const row = rows[0];
  return row ? rowToRequest(row) : null;
}

export async function listPendingInventoryRequestsForAdventure(
  adventureId: string
): Promise<InventoryItemRequest[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT * FROM eldarin_inventory_item_requests
    WHERE adventure_id = ${adventureId} AND status = 'pending'
    ORDER BY created_at ASC
  `;
  return rows.map(rowToRequest);
}

export async function listPendingInventoryRequestsForCharacter(
  characterId: string
): Promise<InventoryItemRequest[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT * FROM eldarin_inventory_item_requests
    WHERE character_id = ${characterId} AND status = 'pending'
    ORDER BY created_at ASC
  `;
  return rows.map(rowToRequest);
}

export async function insertInventoryItemRequest(input: {
  characterId: string;
  adventureId: string;
  roomId?: string | null;
  requesterUserId: string;
  packId: string;
  entryId: string;
  quantity: number;
  mergeExisting: boolean;
  instanceId: string | null;
  itemLabel: string;
}): Promise<InventoryItemRequest | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;

  const now = Date.now();
  const id = newInventoryItemRequestId();

  await sql.unsafe(
    `INSERT INTO eldarin_inventory_item_requests (
      id, character_id, adventure_id, room_id, requester_user_id,
      pack_id, entry_id, quantity, merge_existing, instance_id, item_label,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [
      id,
      input.characterId,
      input.adventureId,
      input.roomId ?? null,
      input.requesterUserId,
      input.packId,
      input.entryId,
      input.quantity,
      input.mergeExisting ? 1 : 0,
      input.instanceId,
      input.itemLabel,
      now,
      now,
    ]
  );
  return fetchInventoryItemRequest(id);
}

export async function listActiveInventoryRequestsForUser(
  adventureId: string,
  requesterUserId: string
): Promise<InventoryItemRequest[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT * FROM eldarin_inventory_item_requests
    WHERE adventure_id = ${adventureId}
      AND requester_user_id = ${requesterUserId}
      AND status IN ('pending', 'approved', 'rejected')
    ORDER BY updated_at DESC
  `;
  return rows.map(rowToRequest);
}

export async function dismissInventoryItemRequest(requestId: string): Promise<boolean> {
  if (!dbEnabled()) return false;
  const sql = getSql();
  if (!sql) return false;
  const now = Date.now();
  const n = await sqlAffected(
    sql,
    `UPDATE eldarin_inventory_item_requests
     SET status = 'consumed', updated_at = ?
     WHERE id = ? AND status IN ('approved', 'rejected')`,
    [now, requestId]
  );
  return n > 0;
}

export async function resolveInventoryItemRequest(
  requestId: string,
  action: "approve" | "reject",
  gmUserId: string
): Promise<InventoryItemRequest | null> {
  if (!dbEnabled()) return null;
  const sql = getSql();
  if (!sql) return null;

  const status: InventoryItemRequestStatus = action === "approve" ? "approved" : "rejected";
  const now = Date.now();

  const n = await sqlAffected(
    sql,
    `UPDATE eldarin_inventory_item_requests
     SET status = ?, gm_user_id = ?, resolved_at = ?, updated_at = ?
     WHERE id = ? AND status = 'pending'`,
    [status, gmUserId, now, now, requestId]
  );
  if (n === 0) return null;
  return fetchInventoryItemRequest(requestId);
}
