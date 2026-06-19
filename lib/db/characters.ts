import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";
import { getSql } from "@/lib/db/client";
import { queryCharactersByOwners } from "@/lib/db/sql-helpers";

function safeNormalizeStoredCharacter(raw: unknown): CharacterSheet | null {
  if (!raw || typeof raw !== "object") return null;
  try {
    return normalizeCharacter(raw as CharacterSheet);
  } catch (err) {
    console.warn(
      "[db] ficha ignorada (JSON inválido):",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export async function fetchCharacter(id: string): Promise<CharacterSheet | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<{ data: CharacterSheet }[]>`
    SELECT data FROM eldarin_characters WHERE id = ${id} LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return safeNormalizeStoredCharacter(row.data);
}

export async function listCharactersByOwner(ownerId: string): Promise<CharacterSheet[]> {
  return listCharactersByOwners([ownerId]);
}

export async function listCharactersByOwners(ownerIds: string[]): Promise<CharacterSheet[]> {
  const sql = getSql();
  if (!sql || ownerIds.length === 0) return [];
  const rows = await queryCharactersByOwners<{ data: CharacterSheet }>(sql, ownerIds, "data");
  return rows
    .map((r) => safeNormalizeStoredCharacter(r.data))
    .filter((sheet): sheet is CharacterSheet => sheet != null);
}

/** Migra fichas de ids legados (`clerk-*`) para o dono canônico da conta. */
export async function reassignCharacterOwners(
  fromOwnerIds: string[],
  toOwnerId: string
): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const aliases = [...new Set(fromOwnerIds.filter((id) => id && id !== toOwnerId))];
  if (aliases.length === 0) return 0;

  const rows = await queryCharactersByOwners<{ id: string; data: CharacterSheet }>(
    sql,
    aliases,
    "id_data"
  );
  if (rows.length === 0) return 0;

  const updatedAt = Date.now();
  for (const row of rows) {
    const normalized = safeNormalizeStoredCharacter({ ...row.data, ownerId: toOwnerId });
    if (!normalized) continue;
    await upsertCharacterRow(sql, normalized, updatedAt);
  }
  return rows.length;
}

async function upsertCharacterRow(
  sql: NonNullable<ReturnType<typeof getSql>>,
  normalized: CharacterSheet,
  updatedAt: number
): Promise<void> {
  await sql.unsafe(
    `INSERT INTO eldarin_characters (id, owner_id, data, updated_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       owner_id = VALUES(owner_id),
       data = VALUES(data),
       updated_at = VALUES(updated_at)`,
    [normalized.id, normalized.ownerId, JSON.stringify(normalized), updatedAt]
  );
}

export async function upsertCharacter(sheet: CharacterSheet): Promise<CharacterSheet> {
  const sql = getSql();
  const normalized = normalizeCharacter(sheet);
  if (!sql) return normalized;

  await upsertCharacterRow(sql, normalized, Date.now());
  return normalized;
}

export async function deleteCharacter(id: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`DELETE FROM eldarin_characters WHERE id = ${id}`;
}
