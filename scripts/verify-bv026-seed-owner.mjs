/**
 * BV-026: o seed de fichas demo no banco (MariaDB) não pode mandar ownerId undefined ao bind
 * (mysql2 recusa undefined) e o aviso de falha não pode citar Postgres.
 * Verificação por leitura do código (padrão dos verify-*.mjs).
 * node scripts/verify-bv026-seed-owner.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ler = (rel) => readFileSync(join(__dirname, "..", rel), "utf8");

const CHARS = ler("lib/character/characters.ts");
const inicio = CHARS.indexOf("async function ensureDbCharactersSeeded");
assert.ok(inicio >= 0, "função ensureDbCharactersSeeded existe");
const fim = CHARS.indexOf("\n}\n", inicio);
const seed = CHARS.slice(inicio, fim);

assert.ok(
  /if \(!sheet\.ownerId\) continue;/.test(seed),
  "seed pula fichas sem ownerId antes do upsert"
);
const posFiltro = seed.indexOf("if (!sheet.ownerId) continue;");
const posUpsert = seed.indexOf("await upsertCharacter(sheet);");
assert.ok(posUpsert > posFiltro && posFiltro > 0, "filtro de ownerId vem antes do upsertCharacter");
assert.ok(!/Postgres/i.test(seed), "aviso do seed não cita Postgres");
assert.ok(seed.includes("no MariaDB falhou"), "aviso do seed cita MariaDB");

console.log("verify-bv026-seed-owner: ok");
