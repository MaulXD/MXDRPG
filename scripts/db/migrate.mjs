#!/usr/bin/env node
import fs from "fs";
import path from "path";
import postgres from "postgres";
import { loadDotEnv } from "./load-env.mjs";
import { normalizeDatabaseUrl } from "./normalize-url.mjs";

loadDotEnv();

const url = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
if (!url) {
  console.error("DATABASE_URL não definida.");
  console.error("  1. Copie .env.example → .env.local");
  console.error("  2. Cole a connection string Neon (pooler recomendado, ?sslmode=require)");
  console.error("  3. npm run db:migrate");
  process.exit(1);
}

const root = process.cwd();
const schemaPath = path.join(root, "scripts/db/schema.sql");
const schema = fs.readFileSync(schemaPath, "utf8");

const local = url.includes("localhost") || url.includes("127.0.0.1");
const sql = postgres(url, {
  max: 1,
  ssl: local ? false : "require",
  connect_timeout: 15,
});

async function seedUsers() {
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
    await sql`
      INSERT INTO eldarin_users (id, email, nickname, name, password_hash, role, created_at)
      VALUES (${u.id}, ${email}, ${nickname}, ${u.name}, ${u.passwordHash}, ${u.role}, ${u.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash
    `;
  }
  console.log(`Seeds: ${users.length} usuário(s)`);
}

async function seedCharactersFromJson() {
  const seedPath = path.join(root, "data/characters/demo.seed.json");
  if (!fs.existsSync(seedPath)) {
    console.log("Seeds: sem data/characters/demo.seed.json (opcional)");
    return;
  }
  const sheets = JSON.parse(fs.readFileSync(seedPath, "utf8"));
  for (const data of sheets) {
    await sql`
      INSERT INTO eldarin_characters (id, owner_id, data, updated_at)
      VALUES (${data.id}, ${data.ownerId}, ${sql.json(data)}, ${Date.now()})
      ON CONFLICT (id) DO UPDATE SET
        owner_id = EXCLUDED.owner_id,
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `;
  }
  console.log(`Seeds: ${sheets.length} personagem(ns)`);
}

try {
  await sql.unsafe(schema);
  console.log("OK — schema em", url.replace(/:[^:@/]+@/, ":****@"));

  const migrationsDir = path.join(root, "scripts/db/migrations");
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const mig = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await sql.unsafe(mig);
      console.log("OK — migration", file);
    }
  }
  await seedUsers();
  await seedCharactersFromJson();
} catch (e) {
  console.error("Migrate falhou:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
