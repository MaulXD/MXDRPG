/**
 * Garante PA mínimo 6 em data/compendiums/monstros.json (alinhado ao livro/VTT).
 * node scripts/bump-monster-pa.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PA_MIN = 6;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "../data/compendiums/monstros.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
let changed = 0;

for (const entry of data) {
  const pa = entry.system?.resources?.pontosAcao;
  if (!pa) continue;
  const beforeMax = pa.max ?? pa.value ?? 0;
  const beforeVal = pa.value ?? beforeMax;
  const max = Math.max(PA_MIN, beforeMax);
  const value = Math.max(PA_MIN, Math.min(max, beforeVal));
  if (max !== beforeMax || value !== beforeVal) {
    pa.max = max;
    pa.value = value;
    changed++;
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`bump-monster-pa: ${changed} entradas atualizadas (mínimo ${PA_MIN} PA)`);
