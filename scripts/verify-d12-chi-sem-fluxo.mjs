/**
 * D12: o Espiritualista nao anuncia "Fluxo Marcial" (desconto de Chi) em nenhum nivel.
 *
 * Livro (livros/LIVRO-DO-JOGADOR.md, linhas 920 e 1167): Chi = 10 por combate, maximo
 * 2 por turno, sem regra de desconto de nivel 5. Codigo: o motor (lib/combat/chi-economy.ts)
 * nao implementa desconto, entao o texto anunciado em classLevelFeatures era falso.
 *
 * Teste de comportamento: chama classLevelFeatures real (loader que transpila .ts e
 * resolve o alias "@/"). Nao usa regex sobre o codigo-fonte.
 * node scripts/verify-d12-chi-sem-fluxo.mjs
 */
import assert from "node:assert/strict";
import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Loader: resolve "@/..." e imports relativos sem extensao para .ts/.tsx e transpila .ts.
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

const { classLevelFeatures } = await import(pathToFileURL(join(ROOT, "lib", "character", "rules.ts")).href);

let pass = 0;
let fail = 0;
function caso(nome, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${nome}`);
  } catch (e) {
    fail++;
    console.log(`  FALHA ${nome}: ${e.message.split("\n")[0]}`);
  }
}

console.log("D12 - Espiritualista sem Fluxo Marcial");

caso('classLevelFeatures("Espiritualista", 5) nao contem "Fluxo Marcial"', () => {
  const nivel5 = classLevelFeatures("Espiritualista", 5);
  assert.ok(!nivel5.some((t) => t.includes("Fluxo Marcial")), `nivel 5 anuncia: ${JSON.stringify(nivel5)}`);
});

caso("nenhum nivel 1 a 20 do Espiritualista anuncia desconto de Chi", () => {
  for (let lv = 1; lv <= 20; lv++) {
    const textos = classLevelFeatures("Espiritualista", lv);
    assert.ok(!textos.some((t) => t.includes("Chi a menos")), `nivel ${lv} anuncia: ${JSON.stringify(textos)}`);
  }
});

caso("o nivel 1 do Espiritualista continua com o teto de Chi do livro", () => {
  const nivel1 = classLevelFeatures("Espiritualista", 1);
  assert.ok(nivel1.some((t) => t.includes("10 Chi/combate") && t.includes("máx. 2 Chi/turno")), JSON.stringify(nivel1));
});

console.log(`\nverify-d12-chi-sem-fluxo: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
