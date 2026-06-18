import type { PlayerBestiaryEntry } from "@/lib/bestiary/types";
import {
  getBestiaryEntry,
  listBestiaryEntriesForUser,
  setBestiaryEntry,
} from "@/lib/bestiary/registry";
import { getSql } from "@/lib/db/client";
import { dbEnabled } from "@/lib/db/enabled";

export async function loadPlayerBestiaryEntry(
  userId: string,
  adventureId: string,
  typeKey: string
): Promise<PlayerBestiaryEntry | null> {
  const cached = getBestiaryEntry(userId, adventureId, typeKey);
  if (cached) return cached;

  const sql = getSql();
  if (!sql || !dbEnabled()) return null;

  const rows = await sql<{ data: PlayerBestiaryEntry }[]>`
    SELECT data FROM eldarin_player_bestiary
    WHERE user_id = ${userId}
      AND adventure_id = ${adventureId}
      AND type_key = ${typeKey}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  setBestiaryEntry(row.data, userId, adventureId);
  return row.data;
}

export async function listPlayerBestiaryEntries(
  userId: string,
  adventureId: string
): Promise<PlayerBestiaryEntry[]> {
  const byType = new Map<string, PlayerBestiaryEntry>();
  for (const entry of listBestiaryEntriesForUser(userId, adventureId)) {
    byType.set(entry.typeKey, entry);
  }

  const sql = getSql();
  if (sql && dbEnabled()) {
    const rows = await sql<{ data: PlayerBestiaryEntry }[]>`
      SELECT data FROM eldarin_player_bestiary
      WHERE user_id = ${userId} AND adventure_id = ${adventureId}
      ORDER BY updated_at DESC
    `;
    for (const row of rows) {
      byType.set(row.data.typeKey, row.data);
      setBestiaryEntry(row.data, userId, adventureId);
    }
  }

  return [...byType.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function savePlayerBestiaryEntry(
  userId: string,
  adventureId: string,
  entry: PlayerBestiaryEntry
): Promise<void> {
  setBestiaryEntry(entry, userId, adventureId);
  const sql = getSql();
  if (!sql || !dbEnabled()) return;

  await sql.unsafe(
    `INSERT INTO eldarin_player_bestiary (user_id, adventure_id, type_key, data, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)`,
    [userId, adventureId, entry.typeKey, JSON.stringify(entry), entry.updatedAt]
  );
}
