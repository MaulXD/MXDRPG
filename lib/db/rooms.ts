import { welcomeChat } from "@/lib/room/chat";
import { normalizeCombatTrack } from "@/lib/room/combat";
import { normalizeRoomSettings } from "@/lib/room/settings";
import type { RoomListItem, RoomState } from "@/lib/room/types";
import type { RoomSettings } from "@/lib/room/settings";
import { dbEnabled, getSql } from "@/lib/db/client";
import { withDbTimeout } from "@/lib/db/timeout";
import { packCombatColumn, unpackCombatColumn } from "@/lib/db/room-combat-meta";
import { memberIdsHasUser } from "@/lib/db/sql-helpers";
import { normalizeRpgSystemId } from "@/lib/rpg/systems";

type RoomRow = {
  room_id: string;
  adventure_id: string;
  owner_id: string;
  name: string;
  rpg_system?: string | null;
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
  const tokens = Array.isArray(row.scene?.tokens) ? row.scene.tokens : [];
  const scene = { ...row.scene, tokens };
  const { combat, combatLog } = unpackCombatColumn(row.combat);
  return {
    roomId: row.room_id,
    adventureId: row.adventure_id ?? row.room_id,
    rpgSystemId: normalizeRpgSystemId(row.rpg_system),
    ownerId: row.owner_id,
    name: row.name,
    inviteCode: row.invite_code,
    memberIds: row.member_ids ?? [],
    scene,
    actors: row.actors ?? {},
    combat: normalizeCombatTrack(combat, tokens),
    combatLog: combatLog ?? [],
    combatUndo: [],
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
    rpg_system: state.rpgSystemId,
    owner_id: state.ownerId,
    name: state.name,
    invite_code: state.inviteCode,
    member_ids: state.memberIds,
    scene: state.scene,
    actors: state.actors,
    combat: packCombatColumn(state),
    chat: state.chat,
    settings: normalizeRoomSettings(state.settings),
    revision: state.revision,
    updated_at: state.updatedAt,
  };
}

/** Só a revisão — evita carregar JSON gigante da mesa a cada poll/SSE. */
export async function fetchRoomRevision(roomId: string): Promise<number | null> {
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await withDbTimeout(
      sql<{ revision: number }[]>`
        SELECT revision FROM eldarin_rooms WHERE room_id = ${roomId} LIMIT 1
      `,
      3000,
      "fetchRoomRevision"
    );
    const rev = rows[0]?.revision;
    return typeof rev === "number" ? rev : null;
  } catch {
    return null;
  }
}

export async function fetchRoom(roomId: string): Promise<RoomState | null> {
  const sql = getSql();
  if (!sql) return null;
  let rows: RoomRow[];
  try {
    rows = await withDbTimeout(
      // TODO(um-anel): incluir "rpg_system" nesta SELECT depois que a migration
      // 018_room_rpg_system.sql rodar em produção (ver scripts/db/schema.mariadb.sql).
      // Até lá, normalizeRpgSystemId(undefined) resolve pra "eldarin" — seguro.
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
  return rowToState(row);
}

export async function saveRoom(state: RoomState): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  const row = stateToRow(state);
  const revGuard = (col: string) =>
    `${col} = IF(revision <= VALUES(revision), VALUES(${col}), ${col})`;
  await withDbTimeout(
    sql.unsafe(
      // TODO(um-anel): incluir "rpg_system" neste INSERT depois que a migration
      // 018_room_rpg_system.sql rodar em produção (ver scripts/db/schema.mariadb.sql).
      `INSERT INTO eldarin_rooms (
        room_id, adventure_id, owner_id, name, invite_code, member_ids,
        scene, actors, combat, chat, settings, revision, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        ${revGuard("adventure_id")},
        ${revGuard("owner_id")},
        ${revGuard("name")},
        ${revGuard("invite_code")},
        ${revGuard("member_ids")},
        ${revGuard("scene")},
        ${revGuard("actors")},
        ${revGuard("combat")},
        ${revGuard("chat")},
        ${revGuard("settings")},
        ${revGuard("revision")},
        ${revGuard("updated_at")}`,
      [
        row.room_id,
        row.adventure_id,
        row.owner_id,
        row.name,
        row.invite_code,
        JSON.stringify(row.member_ids),
        JSON.stringify(row.scene),
        JSON.stringify(row.actors),
        JSON.stringify(row.combat),
        JSON.stringify(row.chat),
        JSON.stringify(row.settings ?? {}),
        row.revision,
        row.updated_at,
      ]
    ),
    5000,
    "saveRoom"
  );
}

export async function insertRoom(state: RoomState): Promise<void> {
  await saveRoom(state);
}

export async function deleteRoom(roomId: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await withDbTimeout(
    sql`DELETE FROM eldarin_rooms WHERE room_id = ${roomId}`,
    5000,
    "deleteRoom"
  );
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
    const member = memberIdsHasUser(userId);
    rows = await withDbTimeout(
      sql.unsafe(
        `SELECT room_id, adventure_id, name, owner_id, invite_code, updated_at
         FROM eldarin_rooms
         WHERE owner_id = ? OR ${member.sql}
         ORDER BY updated_at DESC`,
        [userId, ...member.params]
      ) as Promise<typeof rows>,
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
