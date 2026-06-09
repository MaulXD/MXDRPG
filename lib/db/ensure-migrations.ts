import "server-only";

import { getSql } from "@/lib/db/client";

let ensured = false;
let ensuring: Promise<void> | null = null;

/** Aplica patches idempotentes quando migrate não rodou no deploy (ex.: Vercel). */
export async function ensureDbMigrations(): Promise<void> {
  if (ensured) return;
  if (ensuring) {
    await ensuring;
    return;
  }

  ensuring = (async () => {
    const sql = getSql();
    if (!sql) return;

    await sql.unsafe(`
      ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS oauth_avatar_url TEXT;
      ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS avatar_source TEXT DEFAULT 'oauth';
      UPDATE eldarin_users SET avatar_source = 'oauth' WHERE avatar_source IS NULL;
    `);

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS eldarin_room_presence (
        room_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT 'Jogador',
        last_seen BIGINT NOT NULL,
        PRIMARY KEY (room_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_eldarin_room_presence_room_last_seen
        ON eldarin_room_presence (room_id, last_seen DESC);
    `);

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS eldarin_sheet_edit_requests (
        id TEXT PRIMARY KEY,
        character_id TEXT NOT NULL,
        adventure_id TEXT NOT NULL,
        room_id TEXT,
        requester_user_id TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('full_rebuild', 'last_level')),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'consumed')),
        gm_user_id TEXT,
        resolved_at BIGINT,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_eldarin_sheet_edit_requests_adventure_status
        ON eldarin_sheet_edit_requests (adventure_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_eldarin_sheet_edit_requests_character_status
        ON eldarin_sheet_edit_requests (character_id, status);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_eldarin_sheet_edit_requests_pending_character
        ON eldarin_sheet_edit_requests (character_id)
        WHERE status = 'pending';
    `);

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS eldarin_user_friends (
        user_id TEXT NOT NULL,
        friend_id TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        PRIMARY KEY (user_id, friend_id)
      );
      CREATE INDEX IF NOT EXISTS idx_eldarin_user_friends_friend
        ON eldarin_user_friends (friend_id);

      CREATE TABLE IF NOT EXISTS eldarin_mesa_invites (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        room_id TEXT NOT NULL,
        adventure_id TEXT NOT NULL,
        invite_code TEXT NOT NULL,
        room_name TEXT NOT NULL,
        message TEXT,
        created_at BIGINT NOT NULL,
        dismissed_at BIGINT
      );
      CREATE INDEX IF NOT EXISTS idx_eldarin_mesa_invites_to_user
        ON eldarin_mesa_invites (to_user_id, created_at DESC);
    `);

    await sql.unsafe(`
      ALTER TABLE eldarin_users ADD COLUMN IF NOT EXISTS avatar_focus JSONB;

      CREATE TABLE IF NOT EXISTS eldarin_friend_messages (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_friend_messages_pair
        ON eldarin_friend_messages (from_user_id, to_user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_friend_messages_to
        ON eldarin_friend_messages (to_user_id, created_at DESC);
    `);

    ensured = true;
  })().catch((err) => {
    ensuring = null;
    console.error("[ensureDbMigrations] failed:", err);
    throw err;
  });

  await ensuring;
}
