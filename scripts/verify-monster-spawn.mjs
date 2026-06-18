#!/usr/bin/env node
/**
 * P6 — valida que cada entrada de monstros.json vira template spawnável.
 * Uso: node scripts/verify-monster-spawn.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(join(ROOT, "data/compendiums/monstros.json"), "utf8"));

let errors = 0;
const ids = new Set();

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  errors++;
}

function mod(n) {
  return Math.floor((Number(n) - 10) / 2);
}

for (const entry of raw) {
  const id = entry.id ?? entry.name;
  if (ids.has(id)) fail(`duplicate id ${id}`);
  ids.add(id);

  const sys = entry.system ?? {};
  const vida = sys.resources?.vida?.max ?? sys.resources?.vida?.value;
  const pa = sys.resources?.pontosAcao?.max ?? sys.resources?.pontosAcao?.value;
  const defesa = sys.tactical?.defesa?.value;
  const walk = sys.movement?.cells?.walk?.value;
  const run = sys.movement?.cells?.run?.value;
  const actions = sys.actions;

  if (vida == null || vida < 1) fail(`${id}: vida inválida`);
  if (pa == null || pa < 6) fail(`${id}: PA inválido (mínimo 6)`);
  const paVal = sys.resources?.pontosAcao?.value;
  if (paVal != null && paVal < 6) fail(`${id}: PA value abaixo de 6`);
  if (defesa == null) fail(`${id}: defesa ausente`);
  if (walk == null || run == null) fail(`${id}: movimento célula ausente`);
  if (!Array.isArray(actions) || actions.length < 1) {
    fail(`${id}: precisa de ao menos 1 ação em system.actions`);
  } else {
    for (const a of actions) {
      if (!a.name || a.paCost == null) {
        fail(`${id}: ação ${a.entryId ?? "?"} incompleta`);
      }
      if (a.kind !== "ability" && a.rangeCells == null) {
        fail(`${id}: ação ${a.entryId ?? "?"} sem rangeCells`);
      }
    }
  }

  if (!sys.tactical?.ameaca?.value) fail(`${id}: tactical.ameaca ausente`);
  if (!entry.system?.catalogId?.startsWith("MON-")) {
    fail(`${id}: catalogId MON-* ausente`);
  }
}

console.log(`OK: ${raw.length} monstros spawnáveis (${ids.size} ids)`);
if (errors) {
  console.error(`${errors} problema(s)`);
  process.exit(1);
}
