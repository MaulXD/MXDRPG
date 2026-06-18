#!/usr/bin/env node
import { loadDotEnv } from "./load-env.mjs";
import { createMariaPool, mariaDbUrl, maskUrl } from "./mysql-pool.mjs";

loadDotEnv();

const rawUrl = process.env.DATABASE_URL ?? "";
const url = mariaDbUrl(rawUrl);
if (!url) {
  console.error("DATABASE_URL não definida. Crie .env.local — ver .env.example");
  process.exit(1);
}

if (/^postgres(ql)?:/i.test(rawUrl.trim())) {
  console.error("Postgres não é suportado. Use MariaDB (mysql://...).");
  process.exit(1);
}

const pool = await createMariaPool(rawUrl);

try {
  await pool.execute("SELECT 1 AS ok");
  const [tables] = await pool.execute(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name LIKE 'eldarin_%'
     ORDER BY table_name`
  );
  console.log("OK — MariaDB acessível");
  console.log("Host:", new URL(url).hostname);
  console.log(
    "Tabelas:",
    tables.map((r) => r.table_name).join(", ") || "(nenhuma — rode npm run db:migrate)"
  );
  if (tables.length < 3) {
    console.warn("Aviso: esperado eldarin_users, eldarin_characters, eldarin_rooms");
    process.exit(2);
  }
} catch (e) {
  console.error("Falha:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await pool.end();
}
