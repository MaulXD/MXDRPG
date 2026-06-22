#!/usr/bin/env node
/**
 * Ambiente local completo: MariaDB + schema + mesa de teste + Next.js dev.
 */
import { spawnSync } from "child_process";
import path from "path";

const root = process.cwd();
const node = process.execPath;

function run(relScript, label) {
  console.log(`\n→ ${label ?? relScript}`);
  const r = spawnSync(node, [path.join(root, relScript)], {
    stdio: "inherit",
    cwd: root,
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("MXDRPG — ambiente local (MariaDB + mesa de teste)\n");

run("scripts/homolog/up.mjs", "MariaDB + migrate + seeds");
run("scripts/homolog/dev.mjs", "Next.js dev (homolog)");
