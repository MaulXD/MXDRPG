/**
 * BV-053: tirar a última condição do token deixava o contador ("2R") no mapa.
 *
 * toggleConditionWithDuration devolve timedEffects: undefined quando não sobra
 * nenhum efeito. JSON.stringify apaga chave undefined, o PATCH chegava sem
 * timedEffects e o servidor mesclava o token mantendo o contador antigo.
 * Correção: o painel manda [] nesse caso.
 *
 * node scripts/verify-bv053-condicao-remove.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "components", "vtt", "TokenConditionsPanel.tsx"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

let fail = 0;
function ok(name, cond) {
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
  if (!cond) fail++;
}

console.log("verify-bv053-condicao-remove: tirar condição limpa o contador");
ok(
  "painel manda timedEffects: [] quando não sobra efeito",
  /timedEffects: next\.timedEffects \?\? \[\],/.test(src)
);
ok(
  "o motivo vale: JSON apaga chave undefined",
  JSON.stringify({ conditions: [], timedEffects: undefined }) === '{"conditions":[]}'
);
if (fail) process.exit(1);
