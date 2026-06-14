#!/usr/bin/env node
/**
 * Simulação de balanceamento — monstros vs PCs por nível.
 * Uso: node scripts/balance-monsters-sim.mjs [--level=N] [--outliers]
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  defaultMonsterHp,
  defaultMonsterCa,
  referencePc,
  simulateMonster,
} from "./monster-balance.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LEVELS = [1, 5, 10, 15, 20];

const args = process.argv.slice(2);
const levelArg = args.find((a) => a.startsWith("--level="));
const onlyOutliers = args.includes("--outliers");
const filterLevel = levelArg ? Number(levelArg.split("=")[1]) : null;

const raw = readFileSync(join(ROOT, "data/compendiums/monstros.json"), "utf8");
const monsters = JSON.parse(raw).filter((m) => !m.spawnAlias);

console.log("=== Eldarin v4 — Simulação de balanceamento ===\n");
console.log("PC referência: Guerreiro STR/CON 14+, CA por armadura, 2 ataques nv5+.");
console.log("Alvo TTK mob: 1–2 rod | mini: 2–3 | boss: 3–5 (grupo de 4, foco).\n");

for (const pc of [referencePc(1), referencePc(5), referencePc(10), referencePc(15), referencePc(20)]) {
  console.log(
    `PC nv${pc.level}: HP ${pc.hp} | CA ${pc.ac} | ataque +${pc.hitBonus} | ${pc.attacksPerTurn}× ~${pc.dmgPerHit.toFixed(1)} dmg | party DPR base ${(pc.partySize * pc.attacksPerTurn * pc.dmgPerHit * 0.65).toFixed(0)} (65% acerto)`
  );
}
console.log("");

const rows = [];
for (const m of monsters) {
  const nivel = m.system.tactical.ameaca.value;
  const tier = m.system.tactical.tier;
  const L = filterLevel ?? nivel;
  const sim = simulateMonster(m, L);
  rows.push(sim);
}

function ttkOk(sim) {
  const { tier, roundsToKill: r } = sim;
  if (tier === "boss") return r >= 2 && r <= 7;
  if (tier === "mini") return r >= 1 && r <= 4;
  return r >= 1 && r <= 3;
}

const outliers = rows.filter((r) => !ttkOk(r) || r.roundsToDownPc < 2 || r.roundsToDownPc > 12);

if (onlyOutliers) {
  console.log(`--- Outliers (${outliers.length}/${rows.length}) ---\n`);
  for (const r of outliers.sort((a, b) => a.nivel - b.nivel)) {
    console.log(
      `${r.name} (nv${r.nivel} ${r.tier}) HP${r.hp} CA${r.ca} | TTK ${r.roundsToKill}r (party DPR ${r.partyDpr}) | ameaça PC ${r.roundsToDownPc}r (mon DPR ${r.monsterDpr})`
    );
  }
} else {
  const testLevels = filterLevel ? [filterLevel] : LEVELS;
  for (const L of testLevels) {
    const atLevel = monsters.filter((m) => m.system.tactical.ameaca.value === L);
    if (!atLevel.length) continue;
    console.log(`--- Monstros nv ${L} (PC nv ${L}) ---`);
    for (const m of atLevel) {
      const s = simulateMonster(m, L);
      const flag = ttkOk(s) ? "ok" : "!!";
      console.log(
        `  [${flag}] ${s.name.padEnd(28)} HP${String(s.hp).padStart(3)} CA${String(s.ca).padStart(2)} | morte ${s.roundsToKill}r | PC cai ${s.roundsToDownPc}r`
      );
    }
    console.log("");
  }
}

console.log("--- Curvas padrão (sem flags) ---");
for (const tier of ["mob", "mini", "boss"]) {
  const parts = LEVELS.map((n) => {
    const hp = defaultMonsterHp(n, tier);
    const ca = defaultMonsterCa(n, tier);
    return `nv${n}: HP${hp}/CA${ca}`;
  });
  console.log(`${tier}: ${parts.join(" | ")}`);
}
