/**
 * BV-004: clique simples no icone Ficha ou Invocar nao abria o painel da barra lateral.
 *
 * Causa: `openInDock` chamava `setRegistry` dentro do updater de `setFloating`.
 * O React pode executar um updater mais de uma vez (StrictMode em dev). Como o
 * toggle "fecha se ja estiver aberto" nao e idempotente, a segunda execucao
 * fechava o painel que a primeira acabara de abrir. O Chat parecia funcionar
 * porque, quando flutuante, o toggle nao entra no ramo de fechar.
 *
 * Este script falha se o padrao voltar: `setRegistry` aninhado dentro de um
 * updater de `setFloating`. Uso: node scripts/verify-mesa-barra-lateral.mjs [caminho]
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = process.argv[2] ?? join(__dirname, "..", "hooks", "vtt", "useFoundryWindows.ts");
const src = readFileSync(target, "utf8").replace(/\r\n/g, "\n");

const start = src.indexOf("const openInDock = useCallback(");
const end = src.indexOf("const toggle = openInDock");
if (start < 0 || end < 0 || end <= start) {
  console.error("FALHA: nao achei o bloco openInDock em " + target);
  process.exit(1);
}
const body = src.slice(start, end);

let failed = false;

if (/setFloating\(\(\w+\) => \{[\s\S]*?setRegistry\(/.test(body)) {
  console.error("FALHA (BV-004): setRegistry esta aninhado dentro de um updater de setFloating em openInDock.");
  failed = true;
}

if (!/\}, \[floating\]\);/.test(body)) {
  console.error("FALHA (BV-004): openInDock deveria ler `floating` do escopo e declarar [floating] nas dependencias.");
  failed = true;
}

if (failed) process.exit(1);
console.log("OK: verify-mesa-barra-lateral (BV-004) — openInDock sem setState aninhado.");
