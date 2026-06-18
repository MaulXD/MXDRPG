#!/usr/bin/env node
/**
 * Verifica tabela de solicitações de inventário (migration 015).
 * Requer DATABASE_URL e npm run db:migrate prévio.
 */
import assert from "node:assert/strict";
import { loadDotEnv } from "./db/load-env.mjs";
import { createMariaPool, mariaDbUrl } from "./db/mysql-pool.mjs";

loadDotEnv();

const rawUrl = process.env.DATABASE_URL ?? "";
const url = mariaDbUrl(rawUrl);
if (!url) {
  console.error("DATABASE_URL ausente — pule ou configure .env.local");
  process.exit(1);
}
if (/^postgres(ql)?:/i.test(rawUrl.trim())) {
  console.error("Postgres não é suportado — use MariaDB (mysql://).");
  process.exit(1);
}

const pool = await createMariaPool(rawUrl);

try {
  const [rows] = await pool.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'eldarin_inventory_item_requests'
     ORDER BY ordinal_position`
  );
  assert.ok(rows.length > 0, "tabela eldarin_inventory_item_requests não existe — rode npm run db:migrate");

  const cols = new Set(rows.map((r) => r.column_name ?? r.COLUMN_NAME));
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

  const [checks] = await pool.query(
    `SELECT column_type
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'eldarin_inventory_item_requests'
       AND column_name = 'status'`
  );
  const statusType = String(checks[0]?.column_type ?? checks[0]?.COLUMN_TYPE ?? "").toLowerCase();
  assert.ok(
    statusType.includes("consumed") || statusType.includes("enum"),
    "coluna status deve permitir consumed — rode migration 016"
  );

  console.log("verify-inventory-requests OK —", rows.length, "colunas, status com consumed");
} catch (e) {
  console.error("verify-inventory-requests FALHOU:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await pool.end();
}
