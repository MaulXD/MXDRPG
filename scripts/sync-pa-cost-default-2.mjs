/**
 * Alinha compêndio ao livro: ataques/magias/habilidades com custo 1 PA → 2 PA.
 * Mantém custos já 2+ e ações de monstros (paCost em monstros.json).
 * node scripts/sync-pa-cost-default-2.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "data", "compendiums");
const FILES = ["armas.json", "magias.json", "habilidades.json"];

let total = 0;

for (const file of FILES) {
  const p = path.join(ROOT, file);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const entry of data) {
    const cost = entry.system?.tactical?.custoPontosAcao;
    if (!cost || cost.value !== 1) continue;
    cost.value = 2;
    total += 1;
  }
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`OK ${file}`);
}

console.log(`Atualizados ${total} itens (1 → 2 PA).`);
