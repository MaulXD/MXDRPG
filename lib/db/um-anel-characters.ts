import { normalizeTorCharacter } from "@/lib/character/um-anel/normalize";
import type { TorCharacterSheet } from "@/lib/character/um-anel/types";
import { getSql } from "@/lib/db/client";

function safeNormalizeStoredTorCharacter(raw: unknown): TorCharacterSheet | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    return normalizeTorCharacter(raw as TorCharacterSheet);
  } catch (err) {
    console.warn(
      "[um-anel] ficha ignorada (JSON inválido):",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export async function fetchTorCharacter(id: string): Promise<TorCharacterSheet | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<{ data: TorCharacterSheet }[]>`
    SELECT data FROM um_anel_characters WHERE id = ${id} LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return safeNormalizeStoredTorCharacter(row.data);
}

export async function listTorCharactersByOwners(ownerIds: string[]): Promise<TorCharacterSheet[]> {
  const sql = getSql();
  if (!sql || ownerIds.length === 0) return [];
  const unique = [...new Set(ownerIds)];
  const placeholders = unique.map(() => "?").join(", ");
  const rows = (await sql.unsafe(
    `SELECT data FROM um_anel_characters WHERE owner_id IN (${placeholders}) ORDER BY updated_at DESC`,
    unique
  )) as { data: TorCharacterSheet }[];
  return rows
    .map((r) => safeNormalizeStoredTorCharacter(r.data))
    .filter((sheet): sheet is TorCharacterSheet => sheet != null);
}

export async function upsertTorCharacter(sheet: TorCharacterSheet): Promise<TorCharacterSheet> {
  const sql = getSql();
  const normalized = normalizeTorCharacter(sheet);
  if (!sql) return normalized;

  await sql.unsafe(
    `INSERT INTO um_anel_characters (id, owner_id, data, updated_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       owner_id = VALUES(owner_id),
       data = VALUES(data),
       updated_at = VALUES(updated_at)`,
    [normalized.id, normalized.ownerId, JSON.stringify(normalized), Date.now()]
  );
  return normalized;
}

export async function deleteTorCharacter(id: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`DELETE FROM um_anel_characters WHERE id = ${id}`;
}
