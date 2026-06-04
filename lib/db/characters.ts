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
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql<{ data: CharacterSheet }[]>`
    SELECT data FROM eldarin_characters WHERE owner_id = ${ownerId} ORDER BY updated_at DESC
  `;
  return rows.map((r) => normalizeCharacter(r.data));
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
