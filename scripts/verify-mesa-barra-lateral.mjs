/**
 * BV-004: clique simples no icone Ficha ou Invocar nao abria o painel da barra lateral.
 *
 * Causa: `openInDock` chamava `setRegistry` dentro do updater de `setFloating`.
 * O React pode executar um updater mais de uma vez (StrictMode em dev). Como o
 * toggle "fecha se ja estiver aberto" nao e idempotente, a segunda execucao
 * fechava o painel que a primeira acabara de abrir. O Chat parecia funcionar
 * porque, quando flutuante, o toggle nao entra no ramo de fechar.
 *
 * BV-004b: o mesmo padrao estava em `openAsPopup` e `restore`.
 * A-12a: janela flutuante fora da tela; precisa de listener de resize que prenda as janelas.
 *
 * Este script falha se o padrao voltar: `setRegistry` aninhado dentro de qualquer
 * chamada `setFloating(...)` (aceita `setFloating((x) => ...)` e `setFloating(x => ...)`).
 * Uso: node scripts/verify-mesa-barra-lateral.mjs [caminho]
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = process.argv[2] ?? join(__dirname, "..", "hooks", "vtt", "useFoundryWindows.ts");
const src = readFileSync(target, "utf8").replace(/\r\n/g, "\n");

let failed = false;

// Devolve o texto dos argumentos de uma chamada, a partir do '(' em `open`.
function callArgs(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return text.slice(open);
}

// 1) Nenhum setFloating pode conter setRegistry nos argumentos (qualquer forma de updater).
const floatingCall = /setFloating\(/g;
let m;
while ((m = floatingCall.exec(src))) {
  const open = m.index + "setFloating".length;
  if (/setRegistry\(/.test(callArgs(src, open))) {
    const line = src.slice(0, m.index).split("\n").length;
    console.error(
      `FALHA (BV-004/BV-004b): setRegistry aninhado dentro de setFloating na linha ${line} de ${target}.`
    );
    failed = true;
  }
}

// 2) openInDock: le `floating` do escopo e declara [floating] nas dependencias.
const start = src.indexOf("const openInDock = useCallback(");
const end = src.indexOf("const toggle = openInDock");
if (start < 0 || end < 0 || end <= start) {
  console.error("FALHA: nao achei o bloco openInDock em " + target);
  process.exit(1);
}
if (!/\}, \[floating\]\);/.test(src.slice(start, end))) {
  console.error("FALHA (BV-004): openInDock deveria ler `floating` do escopo e declarar [floating] nas dependencias.");
  failed = true;
}

// 3) A-12a: listener de resize que prende as janelas flutuantes.
if (!/addEventListener\(\s*"resize"/.test(src)) {
  console.error("FALHA (A-12a): falta listener de resize para prender janelas flutuantes na area visivel.");
  failed = true;
}

if (failed) process.exit(1);
console.log("OK: verify-mesa-barra-lateral (BV-004, BV-004b, A-12a) - sem setState aninhado e com listener de resize.");
