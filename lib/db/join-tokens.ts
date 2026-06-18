import "server-only";

import { dbEnabled, getSql } from "@/lib/db/client";
import { sqlAffected } from "@/lib/db/sql-helpers";

export type JoinTokenRow = {
  id: string;
  adventure_id: string;
  token_hash: string;
  created_by: string;
  used_by: string | null;
  used_at: string | number | null;
  created_at: string | number;
};

export async function insertJoinToken(row: {
  id: string;
  adventureId: string;
  tokenHash: string;
  createdBy: string;
}): Promise<void> {
  if (!dbEnabled()) return;
  const sql = getSql();
  if (!sql) return;
  const now = Date.now();
  await sql`
    INSERT INTO eldarin_adventure_join_tokens (
      id, adventure_id, token_hash, created_by, created_at
    ) VALUES (
      ${row.id}, ${row.adventureId}, ${row.tokenHash}, ${row.createdBy}, ${now}
    )
  `;
}

export async function listUnusedJoinTokensForAdventure(
  adventureId: string
): Promise<JoinTokenRow[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  return sql<JoinTokenRow[]>`
    SELECT id, adventure_id, token_hash, created_by, used_by, used_at, created_at
    FROM eldarin_adventure_join_tokens
    WHERE adventure_id = ${adventureId} AND used_by IS NULL
    ORDER BY created_at DESC
  `;
}

export async function listAllUnusedJoinTokens(): Promise<JoinTokenRow[]> {
  if (!dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];
  return sql<JoinTokenRow[]>`
    SELECT id, adventure_id, token_hash, created_by, used_by, used_at, created_at
    FROM eldarin_adventure_join_tokens
    WHERE used_by IS NULL
    ORDER BY created_at DESC
    LIMIT 500
  `;
}

export async function consumeJoinToken(
  tokenId: string,
  usedBy: string
): Promise<boolean> {
  if (!dbEnabled()) return false;
  const sql = getSql();
  if (!sql) return false;
  const now = Date.now();
  const n = await sqlAffected(
    sql,
    `UPDATE eldarin_adventure_join_tokens
     SET used_by = ?, used_at = ?
     WHERE id = ? AND used_by IS NULL`,
    [usedBy, now, tokenId]
  );
  return n > 0;
}
