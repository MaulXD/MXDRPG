/**
 * Valida compêndios após sync:data.
 * Uso: node scripts/verify-compendium-ids.mjs
 */
import { readFileSync as rawReadFileSync, readdirSync } from "fs";

/* Normaliza CRLF -> LF na leitura.

   As asserções deste arquivo casam conteúdo com âncoras de início/fim de linha
   e com trechos multilinha. No Windows, um clone novo — ou qualquer
   `git checkout` com core.autocrlf — entrega CRLF, e aí `\n## Título\n` não
   casa porque vem `\r` antes do `\n`. Comparar conteúdo não deve depender de
   fim de linha: sem isto a suíte falha num repo recém-clonado, e passava aqui
   só porque as ferramentas que escreveram os arquivos usavam LF. */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COMP = join(ROOT, "data", "compendiums");

function load(name) {
  return JSON.parse(readFileSync(join(COMP, name), "utf8"));
}

let errors = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  errors++;
}

for (const file of readdirSync(COMP).filter((f) => f.endsWith(".json"))) {
  const entries = load(file);
  if (!Array.isArray(entries)) continue;

  for (const e of entries) {
    const cid = e.system?.catalogId;
    if (!cid || typeof cid !== "string") {
      fail(`${file} · ${e.id ?? e.name}: missing system.catalogId`);
    }
    const desc = e.system?.description ?? "";
    if (typeof desc === "string" && /<strong>ID:<\/strong>/i.test(desc)) {
      fail(`${file} · ${e.name}: description exposes ID in UI HTML`);
    }
  }
}

const monsters = load("monstros.json");
const monNums = monsters
  .map((m) => m.system?.catalogId)
  .filter((id) => id?.startsWith("MON-"));
if (monNums.length < 60) {
  fail(`monstros.json: expected >=60 MON-* ids, got ${monNums.length}`);
}

if (errors) {
  process.exit(1);
}
console.log(`OK: compendiums verified (${readdirSync(COMP).filter((f) => f.endsWith(".json")).length} files)`);
