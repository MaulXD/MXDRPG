#!/usr/bin/env node
/** Regras culinárias Cap. 5–6 (sem TS compile). */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function mealQualityFromCoccaoRoll(total) {
  if (total <= 7) return "gororoba";
  if (total <= 15) return "comum";
  if (total <= 20) return "gourmet";
  return "perfeito";
}

function maxAssimilationPicksFromPlate(d4) {
  const roll = Math.floor(d4);
  if (roll < 1 || roll > 4) return 1;
  return roll;
}

const paEconomy = fs.readFileSync(path.join(process.cwd(), "lib/combat/pa-economy.ts"), "utf8");
assert.match(paEconomy, /PA_ACCUMULATION_CAP_DEFAULT = 9/, "PA acúmulo 9 (Cap. 2.6)");

assert.equal(mealQualityFromCoccaoRoll(7), "gororoba");
assert.equal(mealQualityFromCoccaoRoll(15), "comum");
assert.equal(mealQualityFromCoccaoRoll(20), "gourmet");
assert.equal(mealQualityFromCoccaoRoll(21), "perfeito");
assert.equal(maxAssimilationPicksFromPlate(4), 4);

const monsters = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data/compendiums/monstros.json"), "utf8")
);
const zumbi = monsters.find((m) => m.id === "monstros-zumbi-de-masmorra");
assert.ok(zumbi, "zumbi no compendio");
const assim = (zumbi.system.actions ?? []).filter((a) => String(a.entryId).startsWith("assim-"));
assert.equal(assim.length, 8, "8 assimilacoes zumbi MON-001");
assert.equal(assim[0].entryId, "assim-001-1");

console.log("verify-culinary OK");
