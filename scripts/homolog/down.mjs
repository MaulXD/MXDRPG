#!/usr/bin/env node
import { spawnSync } from "child_process";
import { composeFile } from "./env.mjs";

const root = process.cwd();

console.log("→ docker compose down");
const r = spawnSync(
  "docker",
  ["compose", "-f", composeFile, "down"],
  {
    stdio: "inherit",
    cwd: root,
    shell: process.platform === "win32",
  }
);
process.exit(r.status ?? 0);
