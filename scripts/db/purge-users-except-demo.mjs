#!/usr/bin/env node
/**
 * Remove todas as contas exceto usr_demo_mestre e usr_demo_jogador.
 * Apaga também fichas, aventuras e salas dos usuários removidos.
 */
import { loadDotEnv } from "./load-env.mjs";
import { createMariaPool, mariaDbUrl } from "./mysql-pool.mjs";

const KEEP = ["usr_demo_mestre", "usr_demo_jogador"];

loadDotEnv();

const rawUrl = process.env.DATABASE_URL ?? "";
const url = mariaDbUrl(rawUrl);
if (!url) {
  console.error("DATABASE_URL não definida (use mysql:// ou mariadb://).");
  process.exit(1);
}
if (/^postgres(ql)?:/i.test(rawUrl.trim())) {
  console.error("Postgres não é suportado — use MariaDB (mysql://).");
  process.exit(1);
}

const pool = await createMariaPool(rawUrl);
const conn = await pool.getConnection();
const inList = KEEP.map(() => "?").join(", ");

try {
  const [before] = await conn.query(
    "SELECT id, email, nickname FROM eldarin_users ORDER BY email"
  );
  console.log(`Usuários antes: ${before.length}`);
  for (const u of before) {
    if (!KEEP.includes(u.id)) console.log(`  - remover: ${u.email} (${u.id})`);
  }

  const [removedChars] = await conn.query(
    `DELETE FROM eldarin_characters WHERE owner_id NOT IN (${inList})`,
    KEEP
  );
  const [removedRooms] = await conn.query(
    `DELETE FROM eldarin_rooms WHERE owner_id NOT IN (${inList})`,
    KEEP
  );
  const [removedAdventures] = await conn.query(
    `DELETE FROM eldarin_adventures WHERE owner_id NOT IN (${inList})`,
    KEEP
  );
  const [removedUsers] = await conn.query(
    `DELETE FROM eldarin_users WHERE id NOT IN (${inList})`,
    KEEP
  );

  const [after] = await conn.query(
    "SELECT id, email, nickname FROM eldarin_users ORDER BY email"
  );
  console.log(`\nRemovidos: ${removedUsers.affectedRows ?? removedUsers.length ?? 0} usuário(s)`);
  console.log(`  fichas: ${removedChars.affectedRows ?? 0}`);
  console.log(`  salas: ${removedRooms.affectedRows ?? 0}`);
  console.log(`  aventuras: ${removedAdventures.affectedRows ?? 0}`);
  console.log(`\nUsuários restantes: ${after.length}`);
  for (const u of after) {
    console.log(`  ✓ ${u.email} (${u.id})`);
  }
} catch (e) {
  console.error("Purge falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  conn.release();
  await pool.end();
}
