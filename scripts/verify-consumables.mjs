#!/usr/bin/env node
/**
 * Verifica compêndio de consumíveis vs efeitos implementados (POC-01 … POC-24).
 * node scripts/verify-consumables.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataPath = path.join(root, "data/compendiums/consumiveis.json");
const effectsPath = path.join(root, "lib/combat/consumable-effects.ts");

const items = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const effectsSrc = fs.readFileSync(effectsPath, "utf8");

const catalogIds = items.map((e) => e.system?.catalogId).filter(Boolean).sort();
assert.equal(catalogIds.length, 24, "esperado 24 consumíveis no JSON");

const pocInSource = [...effectsSrc.matchAll(/"POC-\d+":/g)].map((m) => m[0].slice(1, -2));
const uniquePoc = [...new Set(pocInSource)].sort();

for (const id of catalogIds) {
  assert.ok(uniquePoc.includes(id), `efeito ausente em consumable-effects.ts: ${id}`);
}

for (const id of uniquePoc) {
  assert.ok(catalogIds.includes(id), `efeito órfão sem entrada no JSON: ${id}`);
}

const healIds = ["POC-01", "POC-02", "POC-03", "POC-23"];
for (const id of healIds) {
  assert.match(effectsSrc, new RegExp(`"${id}"[^}]+kind: "heal"`));
}

assert.match(effectsSrc, /"POC-04"[^}]+clear_condition/);
assert.match(effectsSrc, /"POC-20"[^}]+defesa_bonus/);
assert.match(effectsSrc, /"POC-17"[^}]+weapon_coating/);
assert.match(effectsSrc, /"POC-05"[^}]+save_advantage_poison/);

console.log("verify-consumables OK —", catalogIds.length, "itens com efeito mapeado");
