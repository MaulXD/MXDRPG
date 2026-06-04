import { welcomeChat } from "@/lib/room/chat";
import { emptyCombat } from "@/lib/room/combat";
import type { RoomListItem, RoomState } from "@/lib/room/types";
import { dbEnabled, getSql } from "@/lib/db/client";
import { withDbTimeout } from "@/lib/db/timeout";

type RoomRow = {
  room_id: string;
  owner_id: string;
  name: string;
  invite_code: string;
  member_ids: string[];
  scene: RoomState["scene"];
  actors: RoomState["actors"];
  combat: RoomState["combat"];
  chat: RoomState["chat"];
  revision: number;
  updated_at: number;
};

function rowToState(row: RoomRow): RoomState {
  return {
    roomId: row.room_id,
    ownerId: row.owner_id,
    name: row.name,
    inviteCode: row.invite_code,
    memberIds: row.member_ids ?? [],
    scene: row.scene,
    actors: row.actors ?? {},
    combat: row.combat,
    chat: row.chat?.length ? row.chat : [welcomeChat()],
    pings: [],
    revision: row.revision,
    updatedAt: Number(row.updated_at),
  };
}

function stateToRow(state: RoomState): RoomRow {
  return {
    room_id: state.roomId,
    owner_id: state.ownerId,
    name: state.name,
    invite_code: state.inviteCode,
    member_ids: state.memberIds,
    scene: state.scene,
    actors: state.actors,
    combat: state.combat,
    chat: state.chat,
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
        SELECT room_id, owner_id, name, invite_code, member_ids, scene, actors, combat, chat, revision, updated_at
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
      room_id, owner_id, name, invite_code, member_ids,
      scene, actors, combat, chat, revision, updated_at
    ) VALUES (
      ${row.room_id}, ${row.owner_id}, ${row.name}, ${row.invite_code}, ${sql.json(row.member_ids)},
      ${sql.json(row.scene)}, ${sql.json(row.actors)}, ${sql.json(row.combat)}, ${sql.json(row.chat)},
      ${row.revision}, ${row.updated_at}
    )
    ON CONFLICT (room_id) DO UPDATE SET
      owner_id = EXCLUDED.owner_id,
      name = EXCLUDED.name,
      invite_code = EXCLUDED.invite_code,
      member_ids = EXCLUDED.member_ids,
      scene = EXCLUDED.scene,
      actors = EXCLUDED.actors,
      combat = EXCLUDED.combat,
      chat = EXCLUDED.chat,
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
        SELECT room_id, owner_id, name, invite_code, member_ids, scene, actors, combat, chat, revision, updated_at
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

export async function listRoomsForOwnerOrMember(userId: string): Promise<RoomListItem[]> {
  const sql = getSql();
  if (!sql) return [];
  let rows: { room_id: string; name: string; owner_id: string; invite_code: string; updated_at: number }[];
  try {
    rows = await withDbTimeout(
      sql<
        { room_id: string; name: string; owner_id: string; invite_code: string; updated_at: number }[]
      >`
        SELECT room_id, name, owner_id, invite_code, updated_at
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
    name: r.name,
    ownerId: r.owner_id,
    inviteCode: r.invite_code,
    isOwner: r.owner_id === userId,
    updatedAt: Number(r.updated_at),
  }));
}

export { dbEnabled };
