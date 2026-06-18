#!/usr/bin/env node
/**
 * Setup P0: carrega .env.local, migrate, check.
 * Uso: npm run db:setup
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { loadDotEnv } from "./load-env.mjs";

loadDotEnv();

const root = process.cwd();
const envLocal = path.join(root, ".env.local");
const example = path.join(root, ".env.example");

if (!process.env.DATABASE_URL?.trim()) {
  if (!fs.existsSync(envLocal) && fs.existsSync(example)) {
    fs.copyFileSync(example, envLocal);
    console.log("Criado .env.local a partir de .env.example — edite DATABASE_URL e rode de novo.");
  } else {
    console.error("Defina DATABASE_URL em .env.local (MariaDB: mysql://user:pass@host:3306/eldarin).");
    console.error("Guia: docs/P0-NEON-SETUP.md");
  }
  process.exit(1);
}

function run(script) {
  const r = spawnSync(process.execPath, [path.join(root, "scripts/db", script)], {
    stdio: "inherit",
    env: process.env,
    cwd: root,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("→ migrate");
run("migrate.mjs");
console.log("→ check");
run("check.mjs");
console.log("\nP0 local OK. Próximo: npm run dev → http://localhost:3000/api/health");
console.log("Produção: DATABASE_URL no servidor → npm run db:migrate (mesma URL) → redeploy.");
