#!/usr/bin/env node
/**
 * Remove todas as contas exceto usr_demo_mestre e usr_demo_jogador.
 * Apaga também fichas, aventuras e salas dos usuários removidos.
 */
import postgres from "postgres";
import { loadDotEnv } from "./load-env.mjs";
import { normalizeDatabaseUrl } from "./normalize-url.mjs";

const KEEP = ["usr_demo_mestre", "usr_demo_jogador"];

loadDotEnv();

const url = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
if (!url) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const local = url.includes("localhost") || url.includes("127.0.0.1");
const sql = postgres(url, {
  max: 1,
  ssl: local ? false : "require",
  connect_timeout: 15,
});

try {
  const before = await sql`SELECT id, email, nickname FROM eldarin_users ORDER BY email`;
  console.log(`Usuários antes: ${before.length}`);
  for (const u of before) {
    if (!KEEP.includes(u.id)) console.log(`  - remover: ${u.email} (${u.id})`);
  }

  const removedChars = await sql`
    DELETE FROM eldarin_characters
    WHERE owner_id <> ALL(${KEEP})
    RETURNING id
  `;

  const removedRooms = await sql`
    DELETE FROM eldarin_rooms
    WHERE owner_id <> ALL(${KEEP})
    RETURNING room_id
  `;

  const removedAdventures = await sql`
    DELETE FROM eldarin_adventures
    WHERE owner_id <> ALL(${KEEP})
    RETURNING adventure_id
  `;

  const removedUsers = await sql`
    DELETE FROM eldarin_users
    WHERE id <> ALL(${KEEP})
    RETURNING id, email
  `;

  const after = await sql`SELECT id, email, nickname FROM eldarin_users ORDER BY email`;
  console.log(`\nRemovidos: ${removedUsers.length} usuário(s)`);
  console.log(`  fichas: ${removedChars.length}`);
  console.log(`  salas: ${removedRooms.length}`);
  console.log(`  aventuras: ${removedAdventures.length}`);
  console.log(`\nUsuários restantes: ${after.length}`);
  for (const u of after) {
    console.log(`  ✓ ${u.email} (${u.id})`);
  }
} catch (e) {
  console.error("Purge falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
