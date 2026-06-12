import { normalizeCharacter } from "@/lib/character/normalize";
import type { CharacterSheet } from "@/lib/character/types";
import { getSql } from "@/lib/db/client";

export async function fetchCharacter(id: string): Promise<CharacterSheet | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql<{ data: CharacterSheet }[]>`
    SELECT data FROM eldarin_characters WHERE id = ${id} LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return normalizeCharacter(row.data);
}

export async function listCharactersByOwner(ownerId: string): Promise<CharacterSheet[]> {
  return listCharactersByOwners([ownerId]);
}

export async function listCharactersByOwners(ownerIds: string[]): Promise<CharacterSheet[]> {
  const sql = getSql();
  if (!sql || ownerIds.length === 0) return [];
  const unique = [...new Set(ownerIds)];
  const rows = await sql<{ data: CharacterSheet }[]>`
    SELECT data FROM eldarin_characters
    WHERE owner_id = ANY(${unique})
    ORDER BY updated_at DESC
  `;
  return rows.map((r) => normalizeCharacter(r.data));
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

  const rows = await sql<{ id: string; data: CharacterSheet }[]>`
    SELECT id, data FROM eldarin_characters WHERE owner_id = ANY(${aliases})
  `;
  if (rows.length === 0) return 0;

  const updatedAt = Date.now();
  for (const row of rows) {
    const normalized = normalizeCharacter({ ...row.data, ownerId: toOwnerId });
    await sql`
      INSERT INTO eldarin_characters (id, owner_id, data, updated_at)
      VALUES (${normalized.id}, ${toOwnerId}, ${sql.json(normalized)}, ${updatedAt})
      ON CONFLICT (id) DO UPDATE SET
        owner_id = EXCLUDED.owner_id,
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `;
  }
  return rows.length;
}

export async function upsertCharacter(sheet: CharacterSheet): Promise<CharacterSheet> {
  const sql = getSql();
  const normalized = normalizeCharacter(sheet);
  if (!sql) return normalized;

  const updatedAt = Date.now();
  await sql`
    INSERT INTO eldarin_characters (id, owner_id, data, updated_at)
    VALUES (${normalized.id}, ${normalized.ownerId}, ${sql.json(normalized)}, ${updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      owner_id = EXCLUDED.owner_id,
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
  `;
  return normalized;
}

export async function deleteCharacter(id: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`DELETE FROM eldarin_characters WHERE id = ${id}`;
}
