#!/usr/bin/env node
/**
 * Verifica tabela de solicitações de inventário (migration 015).
 * Requer DATABASE_URL e npm run db:migrate prévio.
 */
import assert from "node:assert/strict";
import postgres from "postgres";
import { loadDotEnv } from "./db/load-env.mjs";
import { normalizeDatabaseUrl } from "./db/normalize-url.mjs";

loadDotEnv();

const url = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
if (!url) {
  console.error("DATABASE_URL ausente — pule ou configure .env.local");
  process.exit(1);
}

const local = url.includes("localhost") || url.includes("127.0.0.1");
const sql = postgres(url, {
  max: 1,
  ssl: local ? false : "require",
  connect_timeout: 15,
});

try {
  const rows = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'eldarin_inventory_item_requests'
    ORDER BY ordinal_position
  `;
  assert.ok(rows.length > 0, "tabela eldarin_inventory_item_requests não existe — rode npm run db:migrate");

  const cols = new Set(rows.map((r) => r.column_name));
  for (const required of [
    "id",
    "character_id",
    "adventure_id",
    "pack_id",
    "entry_id",
    "status",
    "item_label",
  ]) {
    assert.ok(cols.has(required), `coluna ausente: ${required}`);
  }

  console.log("verify-inventory-requests OK —", rows.length, "colunas");
} catch (e) {
  console.error("verify-inventory-requests FALHOU:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
