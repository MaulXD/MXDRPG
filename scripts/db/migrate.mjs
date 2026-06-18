#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { loadDotEnv } from "./load-env.mjs";
import { createMariaPool, mariaDbUrl, maskUrl } from "./mysql-pool.mjs";

loadDotEnv();

const rawUrl = process.env.DATABASE_URL ?? "";
const url = mariaDbUrl(rawUrl);
if (!url) {
  console.error("DATABASE_URL não definida.");
  console.error("  1. Copie .env.example → .env.local");
  console.error("  2. Cole a connection string MariaDB (mysql:// ou mariadb://)");
  console.error("  3. npm run db:migrate");
  process.exit(1);
}

if (/^postgres(ql)?:/i.test(rawUrl.trim())) {
  console.error("Postgres não é suportado. Use MariaDB: mysql://user:pass@host:3306/eldarin");
  process.exit(1);
}

const root = process.cwd();
const schemaPath = path.join(root, "scripts/db/schema.mariadb.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

async function seedUsers(pool) {
  const seedPath = path.join(root, "data/users/registry.seed.json");
  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  } catch {
    return;
  }
  for (const u of users) {
    const email = String(u.email).toLowerCase().trim();
    const nickname = u.nickname ? String(u.nickname).toLowerCase().trim() : null;
    await pool.execute(
      `INSERT INTO eldarin_users (id, email, nickname, name, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nickname = VALUES(nickname),
         name = VALUES(name),
         password_hash = VALUES(password_hash)`,
      [u.id, email, nickname, u.name, u.passwordHash, u.role, u.createdAt]
    );
  }
  console.log(`Seeds: ${users.length} usuário(s)`);
}

async function seedCharactersFromJson(pool) {
  const seedPath = path.join(root, "data/characters/demo.seed.json");
  if (!fs.existsSync(seedPath)) {
    console.log("Seeds: sem data/characters/demo.seed.json (opcional)");
    return;
  }
  const sheets = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  for (const data of sheets) {
    const updatedAt = Date.now();
    await pool.execute(
      `INSERT INTO eldarin_characters (id, owner_id, data, updated_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         owner_id = VALUES(owner_id),
         data = VALUES(data),
         updated_at = VALUES(updated_at)`,
      [data.id, data.ownerId, JSON.stringify(data), updatedAt]
    );
  }
  console.log(`Seeds: ${sheets.length} personagem(ns)`);
}

try {
  const pool = await createMariaPool(rawUrl, { multipleStatements: true });
  await pool.query(schema);
  console.log("OK — schema MariaDB em", maskUrl(url));
  await seedUsers(pool);
  await seedCharactersFromJson(pool);
  await pool.end();
} catch (e) {
  console.error("Migrate falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
}
