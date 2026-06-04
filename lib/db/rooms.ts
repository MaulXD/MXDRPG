import { welcomeChat } from "@/lib/room/chat";
import { emptyCombat } from "@/lib/room/combat";
import { normalizeRoomSettings } from "@/lib/room/settings";
import type { RoomListItem, RoomState } from "@/lib/room/types";
import type { RoomSettings } from "@/lib/room/settings";
import { dbEnabled, getSql } from "@/lib/db/client";
import { withDbTimeout } from "@/lib/db/timeout";

type RoomRow = {
  room_id: string;
  adventure_id: string;
  owner_id: string;
  name: string;
  invite_code: string;
  member_ids: string[];
  scene: RoomState["scene"];
  actors: RoomState["actors"];
  combat: RoomState["combat"];
  chat: RoomState["chat"];
  settings?: RoomSettings | null;
  revision: number;
  updated_at: number;
};

function rowToState(row: RoomRow): RoomState {
  return {
    roomId: row.room_id,
    adventureId: row.adventure_id ?? row.room_id,
    ownerId: row.owner_id,
    name: row.name,
    inviteCode: row.invite_code,
    memberIds: row.member_ids ?? [],
    scene: row.scene,
    actors: row.actors ?? {},
    combat: row.combat,
    chat: row.chat?.length ? row.chat : [welcomeChat()],
    pings: [],
    settings: normalizeRoomSettings(row.settings),
    revision: row.revision,
    updatedAt: Number(row.updated_at),
  };
}

function stateToRow(state: RoomState): RoomRow {
  return {
    room_id: state.roomId,
    adventure_id: state.adventureId ?? state.roomId,
    owner_id: state.ownerId,
    name: state.name,
    invite_code: state.inviteCode,
    member_ids: state.memberIds,
    scene: state.scene,
    actors: state.actors,
    combat: state.combat,
    chat: state.chat,
    settings: normalizeRoomSettings(state.settings),
    revision: state.revision,
    updated_at: state.updatedAt,
  };
}

export async function fetchRoom(roomId: string): Promise<RoomState | null> {
  const sql = getSql();
  if (!sql) return null;
  let rows: RoomRow[];
  try {
    rows = await withDbTimeout(
      sql<RoomRow[]>`
        SELECT room_id, adventure_id, owner_id, name, invite_code, member_ids, scene, actors, combat, chat, settings, revision, updated_at
        FROM eldarin_rooms WHERE room_id = ${roomId} LIMIT 1
      `,
      5000,
      "fetchRoom"
    );
  } catch {
    return null;
  }
  const row = rows[0];
  if (!row) return null;
  const state = rowToState(row);
  if (!state.combat) state.combat = emptyCombat(state.scene.tokens);
  return state;
}

export async function saveRoom(state: RoomState): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  const row = stateToRow(state);
  await withDbTimeout(
    sql`
    INSERT INTO eldarin_rooms (
      room_id, adventure_id, owner_id, name, invite_code, member_ids,
      scene, actors, combat, chat, settings, revision, updated_at
    ) VALUES (
      ${row.room_id}, ${row.adventure_id}, ${row.owner_id}, ${row.name}, ${row.invite_code}, ${sql.json(row.member_ids)},
      ${sql.json(row.scene)}, ${sql.json(row.actors)}, ${sql.json(row.combat)}, ${sql.json(row.chat)},
      ${sql.json(row.settings ?? {})}, ${row.revision}, ${row.updated_at}
    )
    ON CONFLICT (room_id) DO UPDATE SET
      adventure_id = EXCLUDED.adventure_id,
      owner_id = EXCLUDED.owner_id,
      name = EXCLUDED.name,
      invite_code = EXCLUDED.invite_code,
      member_ids = EXCLUDED.member_ids,
      scene = EXCLUDED.scene,
      actors = EXCLUDED.actors,
      combat = EXCLUDED.combat,
      chat = EXCLUDED.chat,
      settings = EXCLUDED.settings,
      revision = EXCLUDED.revision,
      updated_at = EXCLUDED.updated_at
  `,
    5000,
    "saveRoom"
  );
}

export async function insertRoom(state: RoomState): Promise<void> {
  await saveRoom(state);
}

export async function fetchRoomByInvite(inviteCode: string): Promise<RoomState | null> {
  const sql = getSql();
  if (!sql) return null;
  const code = inviteCode.trim().toUpperCase();
  let rows: RoomRow[];
  try {
    rows = await withDbTimeout(
      sql<RoomRow[]>`
        SELECT room_id, adventure_id, owner_id, name, invite_code, member_ids, scene, actors, combat, chat, settings, revision, updated_at
        FROM eldarin_rooms WHERE UPPER(invite_code) = ${code} LIMIT 1
      `,
      5000,
      "fetchRoomByInvite"
    );
  } catch {
    return null;
  }
  const row = rows[0];
  return row ? rowToState(row) : null;
}

export async function isRoomInviteTaken(inviteCode: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const code = inviteCode.trim().toUpperCase();
  try {
    const rows = await withDbTimeout(
      sql<{ n: number }[]>`
        SELECT 1 AS n FROM eldarin_rooms WHERE UPPER(invite_code) = ${code} LIMIT 1
      `,
      5000,
      "isRoomInviteTaken"
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function listRoomsForOwnerOrMember(userId: string): Promise<RoomListItem[]> {
  const sql = getSql();
  if (!sql) return [];
  let rows: {
    room_id: string;
    adventure_id: string | null;
    name: string;
    owner_id: string;
    invite_code: string;
    updated_at: number;
  }[];
  try {
    rows = await withDbTimeout(
      sql<
        {
          room_id: string;
          adventure_id: string | null;
          name: string;
          owner_id: string;
          invite_code: string;
          updated_at: number;
        }[]
      >`
        SELECT room_id, adventure_id, name, owner_id, invite_code, updated_at
        FROM eldarin_rooms
        WHERE owner_id = ${userId}
           OR member_ids @> ${sql.json([userId])}::jsonb
        ORDER BY updated_at DESC
      `,
      5000,
      "listRooms"
    );
  } catch {
    return [];
  }
  return rows.map((r) => ({
    roomId: r.room_id,
    adventureId: r.adventure_id ?? r.room_id,
    name: r.name,
    ownerId: r.owner_id,
    inviteCode: r.invite_code,
    isOwner: r.owner_id === userId,
    updatedAt: Number(r.updated_at),
  }));
}

export { dbEnabled };
