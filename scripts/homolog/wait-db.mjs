#!/usr/bin/env node
import { createMariaPool } from "../db/mysql-pool.mjs";
import { ensureHomologEnv } from "./env.mjs";

ensureHomologEnv();

const url = process.env.DATABASE_URL;
const maxAttempts = 30;
const delayMs = 2000;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  let pool;
  try {
    pool = await createMariaPool(url);
    await pool.query("SELECT 1");
    console.log("MXDRPG homolog — MariaDB pronto.");
    process.exit(0);
  } catch (err) {
    if (attempt === maxAttempts) {
      console.error("MariaDB não respondeu a tempo:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
    process.stdout.write(`Aguardando MariaDB (${attempt}/${maxAttempts})…\r`);
    await new Promise((r) => setTimeout(r, delayMs));
  } finally {
    await pool?.end().catch(() => {});
  }
}
