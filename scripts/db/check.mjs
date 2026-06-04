#!/usr/bin/env node
import postgres from "postgres";
import { loadDotEnv } from "./load-env.mjs";
import { normalizeDatabaseUrl } from "./normalize-url.mjs";

loadDotEnv();

const url = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
if (!url) {
  console.error("DATABASE_URL não definida. Crie .env.local — ver docs/P0-NEON-SETUP.md");
  process.exit(1);
}

const local = url.includes("localhost") || url.includes("127.0.0.1");
const sql = postgres(url, {
  max: 1,
  ssl: local ? false : "require",
  connect_timeout: 15,
});

try {
  await sql`SELECT 1 AS ok`;
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'eldarin_%'
    ORDER BY table_name
  `;
  console.log("OK — Postgres acessível");
  console.log("Host:", new URL(url).hostname);
  console.log("Tabelas:", tables.map((r) => r.table_name).join(", ") || "(nenhuma — rode npm run db:migrate)");
  if (tables.length < 3) {
    console.warn("Aviso: esperado eldarin_users, eldarin_characters, eldarin_rooms");
    process.exit(2);
  }
} catch (e) {
  console.error("Falha:", e instanceof Error ? e.message : e);
  console.error("Neon: use string com ?sslmode=require e endpoint -pooler em produção.");
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
