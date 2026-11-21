/**
 * PARSER: a descricao de cada magia em data/compendiums/magias.json tem que
 * conter so o texto da propria magia. Nenhuma pode trazer titulo de outro
 * nivel ("### NIVEL") nem separador de secao ("---").
 *
 * Causa: scripts/generate-compendium.mjs, parseSpellLoreBook, terminava a
 * descricao so no proximo "**Nome**"; o corte do livro ("---" e "### NIVEL 9")
 * ficava colado na ultima magia de cada nivel (ex.: Terremoto).
 *
 * node scripts/verify-parser-grimorio.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const magias = JSON.parse(
  readFileSync(join(root, "data/compendiums/magias.json"), "utf8").replace(/^﻿/, "")
);

let ok = 0;
let falha = 0;
const check = (label, fn) => {
  try {
    fn();
    ok++;
  } catch (err) {
    falha++;
    console.error(`FALHA ${label}: ${err.message}`);
  }
};

const lista = Array.isArray(magias) ? magias : magias.items ?? Object.values(magias);
let comDescricao = 0;
for (const m of lista) {
  const desc = m?.system?.description ?? "";
  if (!desc) continue;
  comDescricao++;
  const nome = m.name ?? m.id ?? "?";
  check(`${nome}: sem "### NIVEL" na descricao`, () => {
    assert.ok(!/### NIVEL/.test(desc), `descricao contem "### NIVEL"`);
  });
  check(`${nome}: sem "---" na descricao`, () => {
    assert.ok(!/---/.test(desc), `descricao contem "---"`);
  });
}

check("ha magias com descricao para conferir", () => {
  assert.ok(comDescricao > 0, "nenhuma descricao encontrada");
});

console.log(`verify-parser-grimorio: ${ok} ok, ${falha} falha (${comDescricao} descricoes)`);
if (falha > 0) process.exit(1);
