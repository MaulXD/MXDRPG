import type { Adventure, AdventureListItem } from "@/lib/adventure/types";
import { getSql } from "@/lib/db/client";
import { withDbTimeout } from "@/lib/db/timeout";

type AdventureRow = {
  adventure_id: string;
  owner_id: string;
  name: string;
  synopsis: string;
  invite_code: string;
  member_ids: string[];
  primary_room_id: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

function rowToAdventure(row: AdventureRow): Adventure {
  return {
    adventureId: row.adventure_id,
    ownerId: row.owner_id,
    name: row.name,
    synopsis: row.synopsis ?? "",
    inviteCode: row.invite_code,
    memberIds: row.member_ids ?? [],
    primaryRoomId: row.primary_room_id,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    deletedAt: row.deleted_at != null ? Number(row.deleted_at) : null,
  };
}

function adventureToRow(a: Adventure): AdventureRow {
  return {
    adventure_id: a.adventureId,
    owner_id: a.ownerId,
    name: a.name,
    synopsis: a.synopsis,
    invite_code: a.inviteCode,
    member_ids: a.memberIds,
    primary_room_id: a.primaryRoomId,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
    deleted_at: a.deletedAt != null ? a.deletedAt : null,
  };
}

export async function fetchAdventureByPrimaryRoom(roomId: string): Promise<Adventure | null> {
  const sql = getSql();
  if (!sql) return null;
  let rows: AdventureRow[];
  try {
    rows = await withDbTimeout(
      sql<AdventureRow[]>`
        SELECT adventure_id, owner_id, name, synopsis, invite_code, member_ids,
               primary_room_id, created_at, updated_at, deleted_at
        FROM eldarin_adventures WHERE primary_room_id = ${roomId} LIMIT 1
      `,
      5000,
      "fetchAdventureByPrimaryRoom"
    );
  } catch {
    return null;
  }
  const row = rows[0];
  return row ? rowToAdventure(row) : null;
}

export async function fetchAdventure(adventureId: string): Promise<Adventure | null> {
  const sql = getSql();
  if (!sql) return null;
  let rows: AdventureRow[];
  try {
    rows = await withDbTimeout(
      sql<AdventureRow[]>`
        SELECT adventure_id, owner_id, name, synopsis, invite_code, member_ids,
               primary_room_id, created_at, updated_at, deleted_at
        FROM eldarin_adventures WHERE adventure_id = ${adventureId} LIMIT 1
      `,
      5000,
      "fetchAdventure"
    );
  } catch {
    return null;
  }
  const row = rows[0];
  return row ? rowToAdventure(row) : null;
}

export async function isInviteCodeTaken(inviteCode: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const code = inviteCode.trim().toUpperCase();
  try {
    const rows = await withDbTimeout(
      sql<{ n: number }[]>`
        SELECT 1 AS n FROM eldarin_adventures WHERE UPPER(invite_code) = ${code} LIMIT 1
      `,
      5000,
      "isInviteCodeTaken"
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function fetchAdventureByInvite(inviteCode: string): Promise<Adventure | null> {
  const sql = getSql();
  if (!sql) return null;
  const code = inviteCode.trim().toUpperCase();
  let rows: AdventureRow[];
  try {
    rows = await withDbTimeout(
      sql<AdventureRow[]>`
        SELECT adventure_id, owner_id, name, synopsis, invite_code, member_ids,
               primary_room_id, created_at, updated_at, deleted_at
        FROM eldarin_adventures WHERE UPPER(invite_code) = ${code} LIMIT 1
      `,
      5000,
      "fetchAdventureByInvite"
    );
  } catch {
    return null;
  }
  const row = rows[0];
  return row ? rowToAdventure(row) : null;
}

export async function saveAdventure(adventure: Adventure): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  const row = adventureToRow(adventure);
  await withDbTimeout(
    sql`
    INSERT INTO eldarin_adventures (
      adventure_id, owner_id, name, synopsis, invite_code, member_ids,
      primary_room_id, created_at, updated_at, deleted_at
    ) VALUES (
      ${row.adventure_id}, ${row.owner_id}, ${row.name}, ${row.synopsis},
      ${row.invite_code}, ${sql.json(row.member_ids)}, ${row.primary_room_id},
      ${row.created_at}, ${row.updated_at}, ${row.deleted_at}
    )
    ON CONFLICT (adventure_id) DO UPDATE SET
      owner_id = EXCLUDED.owner_id,
      name = EXCLUDED.name,
      synopsis = EXCLUDED.synopsis,
      invite_code = EXCLUDED.invite_code,
      member_ids = EXCLUDED.member_ids,
      primary_room_id = EXCLUDED.primary_room_id,
      updated_at = EXCLUDED.updated_at,
      deleted_at = EXCLUDED.deleted_at
  `,
    5000,
    "saveAdventure"
  );
}

export async function listAdventuresForOwnerOrMember(
  userId: string
): Promise<AdventureListItem[]> {
  const sql = getSql();
  if (!sql) return [];
  let rows: AdventureRow[];
  try {
    rows = await withDbTimeout(
      sql<AdventureRow[]>`
        SELECT adventure_id, owner_id, name, synopsis, invite_code, member_ids,
               primary_room_id, created_at, updated_at, deleted_at
        FROM eldarin_adventures
        WHERE owner_id = ${userId}
           OR member_ids @> ${sql.json([userId])}::jsonb
        ORDER BY updated_at DESC
      `,
      5000,
      "listAdventures"
    );
  } catch {
    return [];
  }
  return rows.map((r) => ({
    adventureId: r.adventure_id,
    name: r.name,
    ownerId: r.owner_id,
    inviteCode: r.invite_code,
    primaryRoomId: r.primary_room_id,
    isOwner: r.owner_id === userId,
    updatedAt: Number(r.updated_at),
    deletedAt: r.deleted_at != null ? Number(r.deleted_at) : null,
  }));
}

export async function deleteAdventurePermanent(adventureId: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await withDbTimeout(
    sql`DELETE FROM eldarin_adventures WHERE adventure_id = ${adventureId}`,
    5000,
    "deleteAdventurePermanent"
  );
}
