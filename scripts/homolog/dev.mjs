#!/usr/bin/env node
import { spawnSync } from "child_process";
import path from "path";
import { ensureHomologEnv } from "./env.mjs";

ensureHomologEnv();

const root = process.cwd();
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

console.log("MXDRPG homolog — DATABASE_URL do .env.homolog");
console.log("  http://localhost:3000");
console.log("  /api/health → db: true\n");

const r = spawnSync(process.execPath, [nextBin, "dev", "--turbo"], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});
process.exit(r.status ?? 0);
