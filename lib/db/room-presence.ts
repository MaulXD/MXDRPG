import "server-only";

import { PRESENCE_TTL_MS } from "@/lib/room/presence";
import { dbEnabled, getSql } from "@/lib/db/client";

type PresenceRow = {
  user_id: string;
  display_name: string;
  last_seen: string | number;
};

export async function touchRoomPresenceDb(
  roomId: string,
  userId: string,
  displayName: string
): Promise<void> {
  if (!roomId || !userId || !dbEnabled()) return;
  const sql = getSql();
  if (!sql) return;

  const now = Date.now();
  const label = displayName.trim() || "Jogador";
  await sql`
    INSERT INTO eldarin_room_presence (room_id, user_id, display_name, last_seen)
    VALUES (${roomId}, ${userId}, ${label}, ${now})
    ON CONFLICT (room_id, user_id)
    DO UPDATE SET display_name = EXCLUDED.display_name, last_seen = EXCLUDED.last_seen
  `;
}

export async function listRoomPresenceDb(
  roomId: string,
  ttlMs: number = PRESENCE_TTL_MS
): Promise<{ userId: string; displayName: string }[]> {
  if (!roomId || !dbEnabled()) return [];
  const sql = getSql();
  if (!sql) return [];

  const cutoff = Date.now() - ttlMs;
  const rows = await sql<PresenceRow[]>`
    SELECT user_id, display_name, last_seen
    FROM eldarin_room_presence
    WHERE room_id = ${roomId} AND last_seen >= ${cutoff}
    ORDER BY last_seen DESC
  `;

  return rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name?.trim() || "Jogador",
  }));
}

export async function pruneRoomPresenceDb(roomId: string, ttlMs: number = PRESENCE_TTL_MS): Promise<void> {
  if (!roomId || !dbEnabled()) return;
  const sql = getSql();
  if (!sql) return;

  const cutoff = Date.now() - ttlMs * 3;
  await sql`
    DELETE FROM eldarin_room_presence
    WHERE room_id = ${roomId} AND last_seen < ${cutoff}
  `;
}
