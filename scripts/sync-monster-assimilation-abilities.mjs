#!/usr/bin/env node
/**
 * Injeta as 8 habilidades de assimilação (ASSIMILACAO-POR-ESPECIME.md) e tracos de combate
 * na aba Habilidades do VTT (system.actions com kind: "ability").
 *
 * Uso: node scripts/sync-monster-assimilation-abilities.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MONSTERS_PATH = join(ROOT, "data/compendiums/monstros.json");
const ASSIM_PATH = join(ROOT, "livros/ASSIMILACAO-POR-ESPECIME.md");

/** Tracos de combate na mesa (alem das 8 de assimilacao). */
const COMBAT_TRAITS_BY_MON = {
  "MON-032": [
    {
      name: "Fuga Covarde",
      label: "Reacao: desloca 2 célula ao receber dano (1/combate). Motor: movimento livre do mestre.",
    },
    {
      name: "Ataque Furtivo",
      label: "Passivo: +2d6 em ataques com vantagem (motor goblin-combat).",
    },
    {
      name: "Coordenacao de Horda",
      label: "Passivo: +1 ataque por goblin adjacente ao alvo (max +4).",
    },
  ],
  "MON-067": [
    {
      name: "Fuga Covarde",
      label: "Reacao: desloca 2 célula ao receber dano (1/combate).",
    },
    {
      name: "Ataque Furtivo",
      label: "Passivo: +2d6 em ataques com vantagem.",
    },
    {
      name: "Coordenacao de Horda",
      label: "Passivo: +1 ataque por goblin adjacente ao alvo (max +4).",
    },
  ],
};

function slug(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseAssimilationByCode(md) {
  const map = new Map();
  const blocks = md.split(/^## /m).slice(1);
  for (const block of blocks) {
    const head = block.match(/^(\d{3}) —/);
    if (!head) continue;
    const code = head[1];
    const rows = [];
    for (const line of block.split("\n")) {
      const m = line.match(/^\| (\d) \| ([^|]+) \| ([^|]+) \|/);
      if (!m) continue;
      rows.push({ index: Number(m[1]), name: m[2].trim(), effect: m[3].trim() });
    }
    if (rows.length) map.set(code, rows);
  }
  return map;
}

function assimAction(catalogId, row) {
  const num = String(row.index).padStart(1, "0");
  const monNum = catalogId.replace("MON-", "");
  return {
    packId: "habilidades",
    entryId: `assim-${monNum}-${num}`,
    name: row.name,
    kind: "ability",
    resolution: "attack",
    damageFormula: "0",
    damageType: "—",
    attackBonus: 0,
    rangeCells: 0,
    paCost: 0,
    selfTarget: true,
    label: `Assimilacao: ${row.effect}`,
  };
}

function combatTraitAction(catalogId, trait, idx) {
  const monNum = catalogId.replace("MON-", "");
  return {
    packId: "habilidades",
    entryId: `trait-${monNum}-${slug(trait.name)}`,
    name: trait.name,
    kind: "ability",
    resolution: "attack",
    damageFormula: "0",
    damageType: "—",
    attackBonus: 0,
    rangeCells: 0,
    paCost: 0,
    selfTarget: true,
    label: trait.label,
  };
}

function isAssimOrTrait(entryId) {
  return entryId?.startsWith("assim-") || entryId?.startsWith("trait-");
}

const assimByCode = parseAssimilationByCode(readFileSync(ASSIM_PATH, "utf8"));
const monsters = JSON.parse(readFileSync(MONSTERS_PATH, "utf8"));

let updated = 0;
let abilityCount = 0;

for (const entry of monsters) {
  const catalogId = entry.system?.catalogId;
  if (!catalogId?.startsWith("MON-")) continue;

  const monCode = catalogId.replace("MON-", "").padStart(3, "0");
  const assimRows = assimByCode.get(monCode) ?? [];
  const traits = COMBAT_TRAITS_BY_MON[catalogId] ?? [];

  const base = (entry.system.actions ?? []).filter((a) => !isAssimOrTrait(a.entryId));
  const extra = [
    ...traits.map((t, i) => combatTraitAction(catalogId, t, i)),
    ...assimRows.map((r) => assimAction(catalogId, r)),
  ];

  entry.system.actions = [...base, ...extra];
  updated++;
  abilityCount += extra.length;
}

writeFileSync(MONSTERS_PATH, JSON.stringify(monsters, null, 2) + "\n");
console.log(
  `OK: ${updated} monstros com habilidades (${abilityCount} entradas assimilacao+tracos injetadas)`
);
