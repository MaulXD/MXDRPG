#!/usr/bin/env node
/**
 * Cria/atualiza aventura + sala persistida para testes locais (MariaDB homolog).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ensureHomologEnv } from "./env.mjs";
import { createMariaPool } from "../db/mysql-pool.mjs";

const seedPath = path.join(process.cwd(), "data/homolog/mesa-local.seed.json");

export async function seedLocalMesa() {
  if (!fs.existsSync(seedPath)) {
    console.warn("seed-local: sem data/homolog/mesa-local.seed.json");
    return;
  }

  const { adventure, room } = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  const now = Date.now();

  const pool = await createMariaPool(process.env.DATABASE_URL);
  try {
    await pool.execute(
      `INSERT INTO eldarin_adventures (
        adventure_id, owner_id, name, synopsis, rpg_system, access_mode,
        invite_code, member_ids, primary_room_id, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        synopsis = VALUES(synopsis),
        access_mode = VALUES(access_mode),
        invite_code = VALUES(invite_code),
        member_ids = VALUES(member_ids),
        primary_room_id = VALUES(primary_room_id),
        updated_at = VALUES(updated_at),
        deleted_at = NULL`,
      [
        adventure.adventureId,
        adventure.ownerId,
        adventure.name,
        adventure.synopsis,
        adventure.rpgSystemId ?? "eldarin",
        adventure.accessMode ?? "public",
        adventure.inviteCode,
        JSON.stringify(adventure.memberIds ?? []),
        adventure.primaryRoomId,
        now,
        now,
      ]
    );

    await pool.execute(
      `INSERT INTO eldarin_rooms (
        room_id, adventure_id, owner_id, name, invite_code, member_ids,
        scene, actors, combat, chat, settings, revision, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      ON DUPLICATE KEY UPDATE
        adventure_id = VALUES(adventure_id),
        name = VALUES(name),
        invite_code = VALUES(invite_code),
        member_ids = VALUES(member_ids),
        scene = VALUES(scene),
        actors = VALUES(actors),
        combat = VALUES(combat),
        chat = VALUES(chat),
        settings = VALUES(settings),
        updated_at = VALUES(updated_at)`,
      [
        room.roomId,
        room.adventureId,
        room.ownerId,
        room.name,
        room.inviteCode,
        JSON.stringify(room.memberIds ?? []),
        JSON.stringify(room.scene),
        JSON.stringify(room.actors ?? {}),
        JSON.stringify(room.combat ?? { order: [], activeIndex: 0, round: 1 }),
        JSON.stringify(room.chat ?? []),
        JSON.stringify(room.settings ?? {}),
        now,
      ]
    );

    console.log("Seeds: mesa-local (MariaDB persistida)");
    console.log("  http://localhost:3000/mesa/mesa-local");
    console.log("  http://localhost:3000/aventura/mesa-local");
    console.log("  convite: LOCALTST — mestre/jogador senha 123");
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ensureHomologEnv();
  seedLocalMesa().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
