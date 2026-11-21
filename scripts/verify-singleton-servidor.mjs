/**
 * SINGLETON (BV-048, varredura): estado de modulo do servidor que uma rota grava e outra le
 * quebra do mesmo jeito que o emissor do notifier. Corrigido aqui: lib/room/revision-cache.ts
 * (Map de revisao da sala, escrito por getRoom/getRoomRevision em varias rotas e lido pela
 * rota SSE). Agora o Map fica em globalThis.__eldarinRevisionCache.
 *
 * Teste: carrega o modulo duas vezes (instancia nova via query string, como o Next faz por
 * rota). Grava na instancia 1 e le na instancia 2. Esperado: 7 e, depois de invalidar na
 * instancia 2, null na instancia 1. Antes da correcao: null na instancia 2.
 *
 * node scripts/verify-singleton-servidor.mjs
 */
import assert from "node:assert/strict";
import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Loader: transpila .ts, resolve "@/..." e imports relativos sem extensao, troca "server-only"
// por modulo vazio e aceita query string no entry (?instancia=2) para forcar nova instancia.
const hookSrc = `
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from ${JSON.stringify(pathToFileURL(join(ROOT, "node_modules", "typescript", "lib", "typescript.js")).href)};
const ROOT = ${JSON.stringify(ROOT)};
function achaArquivo(base) {
  for (const c of [base, base + ".ts", base + ".tsx", join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}
export async function resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
  let base = null;
  if (specifier.startsWith("@/")) base = join(ROOT, specifier.slice(2));
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    base = join(dirname(fileURLToPath(context.parentURL)), specifier);
  }
  if (base) {
    const f = achaArquivo(base);
    if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
  }
  return next(specifier, context);
}
export async function load(url, context, next) {
  if (url.startsWith("file:") && url.includes("?")) {
    return load(url.slice(0, url.indexOf("?")), context, next);
  }
  if (url.startsWith("file:") && /\\.tsx?$/.test(url)) {
    const src = readFileSync(fileURLToPath(url), "utf8");
    const out = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
      fileName: fileURLToPath(url),
    }).outputText;
    return { format: "module", source: out, shortCircuit: true };
  }
  return next(url, context);
}
`;
register("data:text/javascript," + encodeURIComponent(hookSrc));

const cachePath = pathToFileURL(join(ROOT, "lib", "room", "revision-cache.ts")).href;

const instancia1 = await import(cachePath);
const instancia2 = await import(cachePath + "?instancia=2");
assert.notEqual(instancia2, instancia1, "a segunda importacao deve ser outra instancia do modulo");

const sala = "sala-singleton-teste";
instancia1.writeCachedRevision(sala, 7);
assert.equal(
  instancia2.readCachedRevision(sala),
  7,
  "revisao gravada numa instancia do modulo deve ser lida na outra (estado em globalThis)"
);

instancia2.invalidateRevisionCache(sala);
assert.equal(
  instancia1.readCachedRevision(sala),
  null,
  "invalidacao feita numa instancia deve valer na outra"
);

console.log("OK verify-singleton-servidor: revision-cache compartilhado entre instancias do modulo");
