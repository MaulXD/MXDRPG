/**
 * BV-047: wizard de personagem mostrava "Server Too many connections" (MariaDB, ER_CON_COUNT_ERROR).
 * Causa: lib/db/client-mariadb.ts guardava o pool em uma variavel de modulo. Em dev, o Next
 * reavalia o modulo (mudancas de arquivo, rotas compiladas separadamente) e cada reavaliacao
 * criava um pool novo com connectionLimit 10, sem fechar o antigo. O processo `next dev` chegou
 * a 151 conexoes ESTABLISHED no MariaDB (max_connections = 151).
 * Correcao: o pool fica em globalThis; uma segunda instancia do modulo reaproveita o mesmo pool.
 *
 * Teste: carrega o modulo duas vezes (instancia nova via query string) e conta chamadas a
 * mysql.createPool. Esperado: 1. Antes da correcao, 2.
 *
 * node scripts/verify-bv047-pool-mariadb.mjs
 */
import assert from "node:assert/strict";
import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRoot = createRequire(join(ROOT, "package.json"));

// Loader: transpila .ts, resolve "@/..." e imports relativos sem extensao, e aceita
// query string no entry (?instancia=2) para forcar uma nova instancia do modulo.
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
    const bare = url.slice(0, url.indexOf("?"));
    const r = await load(bare, context, next);
    return r;
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

// Conta criacoes de pool sem abrir conexao real.
const mysql = requireFromRoot("mysql2/promise");
let criados = 0;
mysql.createPool = () => {
  criados += 1;
  return {};
};

process.env.DATABASE_URL = "mysql://usuario:senha@127.0.0.1:3306/teste";

const clientPath = pathToFileURL(join(ROOT, "lib", "db", "client-mariadb.ts")).href;

// Instancia 1: primeiro carregamento do modulo.
const instancia1 = await import(clientPath);
assert.ok(instancia1.getMariaSql(), "getMariaSql deve devolver o cliente com DATABASE_URL definida");
instancia1.getMariaSql();
assert.equal(criados, 1, "uma instancia do modulo deve criar um unico pool");

// Instancia 2: o Next reavalia o modulo (HMR / bundle de outra rota) e o estado de modulo some.
const instancia2 = await import(clientPath + "?instancia=2");
assert.notEqual(instancia2, instancia1, "a segunda importacao deve ser outra instancia do modulo");
assert.ok(instancia2.getMariaSql(), "a nova instancia deve funcionar");
assert.equal(
  criados,
  1,
  `nova instancia do modulo criou pool extra (criados=${criados}); cada pool abre ate 10 conexoes no MariaDB`
);

console.log("OK verify-bv047-pool-mariadb: um unico pool mesmo com o modulo reavaliado");
