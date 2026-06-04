#!/usr/bin/env node
/**
 * Smoke P0: GET /api/health deve retornar db:true quando DATABASE_URL está ativa no servidor.
 */
import { loadDotEnv } from "../db/load-env.mjs";

loadDotEnv();

const base = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const url = `${base}/api/health`;

let res;
try {
  res = await fetch(url, { signal: AbortSignal.timeout(8000) });
} catch (e) {
  console.error(`Falha ao chamar ${url}:`, e instanceof Error ? e.message : e);
  console.error("Suba o app: npm run dev");
  process.exit(1);
}

const body = await res.json().catch(() => ({}));
console.log(url, "→", res.status, JSON.stringify(body, null, 2));

if (!res.ok || !body.ok) {
  process.exit(1);
}

const expectDb = Boolean(process.env.DATABASE_URL?.trim());
if (expectDb && !body.db) {
  console.error("Esperado db:true (DATABASE_URL no .env.local do servidor Next).");
  if (body.dbError) console.error("dbError:", body.dbError);
  process.exit(1);
}

if (!expectDb) {
  console.warn("DATABASE_URL ausente — smoke OK em modo memory.");
}

console.log("smoke:p0 OK");
