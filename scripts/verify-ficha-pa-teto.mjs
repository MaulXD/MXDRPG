/**
 * BV-014: a ficha (fora da mesa) mostrava PA 9/5, com o máximo igual à recuperação (5).
 * A mesa usa o teto do pool (accumulationCap = 9). paPoolMaxForSheet é o teto que as
 * telas de ficha e os cards da mesa passam a mostrar.
 *
 * Teste de comportamento: chama a função real (loader que transpila .ts e resolve "@/").
 * node scripts/verify-ficha-pa-teto.mjs
 */
import assert from "node:assert/strict";
import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  if (url.startsWith("file:") && /\\.tsx?$/.test(url)) {
    const src = readFileSync(fileURLToPath(url), "utf8");
    const out = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
      fileName: fileURLToPath(url),
    }).outputText;
    return { format: "module", source: out, shortCircuit: true };
  }
  if (url.startsWith("file:") && url.endsWith(".json")) {
    return { format: "json", source: readFileSync(fileURLToPath(url), "utf8"), shortCircuit: true };
  }
  return next(url, context);
}
`;
register("data:text/javascript," + encodeURIComponent(hookSrc));

const { paPoolMaxForSheet, PA_ACCUMULATION_CAP_DEFAULT, PA_RECOVERY_PER_TURN } = await import(
  pathToFileURL(join(ROOT, "lib", "combat", "pa-economy.ts")).href
);
const { PA_MAX_BY_TALENT } = await import(pathToFileURL(join(ROOT, "lib", "character", "pa-modifiers.ts")).href);

function ficha(talentos = []) {
  return { identity: { talentos }, resources: { pontosAcao: { value: 9, max: 5 } } };
}

let pass = 0;
let fail = 0;
function caso(nome, fn) {
  try {
    fn();
    pass++;
    console.log("  ok  " + nome);
  } catch (e) {
    fail++;
    console.log("  FAIL " + nome + "\n       " + e.message);
  }
}

caso("sem talento, o teto do pool é 9 (não a recuperação 5)", () => {
  assert.equal(paPoolMaxForSheet(ficha()), 9);
  assert.equal(paPoolMaxForSheet(ficha()), PA_ACCUMULATION_CAP_DEFAULT);
  assert.notEqual(paPoolMaxForSheet(ficha()), PA_RECOVERY_PER_TURN);
});

caso("valor 9 cabe no teto 9 (não mostra 9/5)", () => {
  const sheet = ficha();
  const max = paPoolMaxForSheet(sheet);
  const value = Math.min(sheet.resources.pontosAcao.value, max);
  assert.equal(`${value}/${max}`, "9/9");
});

const talentoComBonus = Object.entries(PA_MAX_BY_TALENT).find(([, v]) => typeof v === "number" && v > 0);
caso("talento de PA soma ao teto do pool", () => {
  assert.ok(talentoComBonus, "PA_MAX_BY_TALENT sem talento com bônus numérico");
  const [talentId, bonus] = talentoComBonus;
  assert.equal(paPoolMaxForSheet(ficha([{ id: talentId }])), 9 + bonus);
});

console.log(`\nverify-ficha-pa-teto: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
