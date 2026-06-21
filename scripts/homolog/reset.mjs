#!/usr/bin/env node
import { spawnSync } from "child_process";
import path from "path";
import { composeFile } from "./env.mjs";

const root = process.cwd();

console.log("→ docker compose down -v (apaga volume homolog)");
let r = spawnSync(
  "docker",
  ["compose", "-f", composeFile, "down", "-v"],
  {
    stdio: "inherit",
    cwd: root,
    shell: process.platform === "win32",
  }
);
if (r.status !== 0) process.exit(r.status ?? 1);

r = spawnSync(process.execPath, [path.join(root, "scripts/homolog/up.mjs")], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});
process.exit(r.status ?? 0);
