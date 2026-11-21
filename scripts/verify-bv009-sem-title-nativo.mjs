// BV-009 / BV-020: elementos HTML minusculos nao podem receber o atributo nativo `title`.
// O NativeTitleBlockScript troca title por data-site-tip depois da hidratacao, e isso gera
// divergencia entre o HTML do servidor e o do cliente. Use data-site-tip (mesmo texto).
// Props de componente React (tag maiuscula, ex.: <FoundryWindow title=...>) nao sao afetadas.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["components", "app"];

// Excecoes justificadas (tags minusculas que NAO sao HTML de pagina):
// - elementos SVG (svg, path, g, circle, ...): o title de SVG e o texto de acessibilidade/tooltip do desenho.
// - title: a tag <title> do head, que nao tem atributo title.
const EXCLUDED = new Set([
  "svg", "path", "g", "circle", "rect", "line", "polygon", "polyline", "ellipse", "text", "use",
  "defs", "title", "foreignObject", "symbol", "clipPath", "mask", "linearGradient", "radialGradient",
  "stop", "marker",
]);

const WS = (c) => c === " " || c === "\n" || c === "\r" || c === "\t";

function skipString(src, k) {
  const q = src[k];
  for (let j = k + 1; j < src.length; j++) {
    if (src[j] === "\\") { j++; continue; }
    if (src[j] === q) return j;
  }
  return src.length;
}

function skipBraces(src, i) {
  let depth = 0;
  for (let k = i; k < src.length; k++) {
    const c = src[k];
    if (c === '"' || c === "'" || c === "`") { k = skipString(src, k); continue; }
    if (c === "/" && src[k + 1] === "/") { k = src.indexOf("\n", k); if (k < 0) return src.length; continue; }
    if (c === "/" && src[k + 1] === "*") { k = src.indexOf("*/", k) + 1; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return k + 1; }
  }
  return src.length;
}

// Le a tag de abertura que comeca em `lt` e devolve os atributos de nivel 0. null se nao for tag.
function parseOpenTag(src, lt) {
  const m = /^<([a-z][A-Za-z0-9-]*)/.exec(src.slice(lt, lt + 80));
  if (!m) return null;
  let i = lt + m[0].length;
  const name = m[1];
  const attrs = [];
  while (i < src.length) {
    while (i < src.length && WS(src[i])) i++;
    if (src[i] === ">") return { name, attrs, start: lt };
    if (src[i] === "/" && src[i + 1] === ">") return { name, attrs, start: lt };
    if (src[i] === "{") { i = skipBraces(src, i); continue; }
    const nm = /^[A-Za-z_:][-A-Za-z0-9_:.]*/.exec(src.slice(i, i + 200));
    if (!nm) return null;
    const aStart = i;
    i += nm[0].length;
    let j = i;
    while (WS(src[j])) j++;
    if (src[j] === "=") {
      j++;
      while (WS(src[j])) j++;
      if (src[j] === '"' || src[j] === "'") { const q = src[j]; j++; while (j < src.length && src[j] !== q) j++; j++; }
      else if (src[j] === "{") j = skipBraces(src, j);
      else return null;
      i = j;
    }
    attrs.push({ name: nm[0], start: aStart });
  }
  return null;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(tsx|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

const falhas = [];
let tagsComTitle = 0;
for (const d of DIRS) {
  for (const file of walk(path.join(ROOT, d))) {
    const src = fs.readFileSync(file, "utf8");
    if (!/\stitle=/.test(src)) continue;
    let i = 0;
    while ((i = src.indexOf("<", i)) >= 0) {
      const t = parseOpenTag(src, i);
      if (!t) { i++; continue; }
      i = t.start + 1;
      if (EXCLUDED.has(t.name)) continue;
      if (t.attrs.some((a) => a.name === "title")) {
        tagsComTitle++;
        const linha = src.slice(0, t.start).split("\n").length;
        falhas.push(`${path.relative(ROOT, file)}:${linha} <${t.name} title=...>`);
      }
    }
  }
}

// Regressao direta do BV-009: o icone do compendio usa data-site-tip, nao title.
const iconSrc = fs.readFileSync(path.join(ROOT, "components/compendium/CompendiumIcon.tsx"), "utf8");
if (/\stitle=\{label\}/.test(iconSrc) || !/data-site-tip=\{label\}/.test(iconSrc)) {
  falhas.push("components/compendium/CompendiumIcon.tsx: esperado data-site-tip={label} no lugar de title");
}

if (falhas.length) {
  console.error(`BV-009: ${tagsComTitle} elemento(s) HTML minusculo(s) ainda com title nativo:`);
  for (const f of falhas.slice(0, 50)) console.error("  " + f);
  process.exit(1);
}
console.log("BV-009 ok: nenhum title nativo em elemento HTML minusculo (components/, app/); CompendiumIcon usa data-site-tip.");
