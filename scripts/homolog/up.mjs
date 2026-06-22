#!/usr/bin/env node
import { spawnSync } from "child_process";
import path from "path";
import { ensureHomologEnv, composeFile } from "./env.mjs";
import { ensureNativeMariaDb } from "./native-mariadb.mjs";
import { seedLocalMesa } from "./seed-local.mjs";

ensureHomologEnv();

const root = process.cwd();

function runMigrate() {
  console.log("→ migrate");
  const migrate = spawnSync(process.execPath, [path.join(root, "scripts/db/migrate.mjs")], {
    stdio: "inherit",
    env: process.env,
    cwd: root,
  });
  if (migrate.status !== 0) process.exit(migrate.status ?? 1);
}

function runWaitDb() {
  console.log("→ aguardar MariaDB");
  const wait = spawnSync(process.execPath, [path.join(root, "scripts/homolog/wait-db.mjs")], {
    stdio: "inherit",
    env: process.env,
    cwd: root,
  });
  if (wait.status !== 0) process.exit(wait.status ?? 1);
}

const dockerProbe = spawnSync("docker", ["--version"], {
  stdio: "pipe",
  shell: process.platform === "win32",
});

if (dockerProbe.status === 0) {
  console.log("→ docker compose up");
  const up = spawnSync(
    "docker",
    ["compose", "-f", composeFile, "up", "-d"],
    { stdio: "inherit", cwd: root, shell: process.platform === "win32" }
  );
  if (up.status !== 0) process.exit(up.status ?? 1);
  runWaitDb();
} else {
  console.log("Docker não encontrado — usando MariaDB nativo (Windows).");
  const ok = await ensureNativeMariaDb();
  if (!ok) {
    console.error("Instale MariaDB (winget install MariaDB.Server) ou Docker Desktop.");
    console.error("Guia: docs/HOMOLOG.md");
    process.exit(1);
  }
}

runMigrate();
await seedLocalMesa();

console.log("\nMXDRPG homolog OK.");
console.log("  npm run local       → DB + mesa de teste + dev");
console.log("  npm run dev:homolog → só o Next (DB já deve estar up)");
console.log("  npm run homolog:down → para Docker (se usado)");
