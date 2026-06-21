import "server-only";

import { getSql } from "@/lib/db/client";

let ensured = false;
let ensuring: Promise<void> | null = null;

async function ensureMariaDbPatches(sql: NonNullable<ReturnType<typeof getSql>>): Promise<void> {
  const nowMs = Date.now();

  await sql.unsafe(
    `UPDATE eldarin_adventures SET name = 'Minha paz', updated_at = ?
     WHERE LOWER(TRIM(name)) = 'minha rola'`,
    [nowMs]
  );

  await sql.unsafe(
    `UPDATE eldarin_rooms
     SET name = 'Minha paz',
         scene = JSON_SET(COALESCE(scene, JSON_OBJECT()), '$.name', 'Minha paz'),
         updated_at = ?
     WHERE LOWER(TRIM(name)) = 'minha rola'`,
    [nowMs]
  );

  await sql.unsafe(
    `UPDATE eldarin_characters
     SET data = JSON_SET(COALESCE(data, JSON_OBJECT()), '$.name', 'Minha paz'),
         updated_at = ?
     WHERE LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(data, '$.name')))) = 'minha rola'`,
    [nowMs]
  );

  await sql.unsafe(
    `UPDATE eldarin_friend_messages SET read_at = created_at WHERE read_at IS NULL`
  );

  await sql.unsafe(
    `UPDATE eldarin_users SET avatar_source = 'oauth' WHERE avatar_source IS NULL`
  );

  await sql.unsafe(
    `UPDATE eldarin_adventures SET rpg_system = 'eldarin'
     WHERE rpg_system IS NULL OR TRIM(rpg_system) = ''`
  );

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS eldarin_room_presence (
      room_id VARCHAR(64) NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      display_name VARCHAR(120) NOT NULL DEFAULT 'Jogador',
      last_seen BIGINT NOT NULL,
      PRIMARY KEY (room_id, user_id),
      KEY idx_eldarin_room_presence_room_last_seen (room_id, last_seen)
    )
  `);
}

/** Aplica patches idempotentes quando migrate não rodou no deploy. */
export async function ensureDbMigrations(): Promise<void> {
  if (ensured) return;
  if (ensuring) {
    await ensuring;
    return;
  }

  ensuring = (async () => {
    const sql = getSql();
    if (!sql) {
      ensured = true;
      return;
    }
    try {
      await ensureMariaDbPatches(sql);
    } catch (err) {
      console.error("[ensureDbMigrations] failed:", err);
    }
    ensured = true;
  })().finally(() => {
    ensuring = null;
  });

  await ensuring;
}
