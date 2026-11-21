/**
 * D-12: o PA guardado na ficha (resources.pontosAcao.value) deve respeitar o teto
 * do pool (paPoolMaxForSheet, 9 sem talento), e nao o max de recuperacao (5).
 *
 * Causa: lib/character/normalize.ts e lib/character/identity.ts limitavam o value
 * ao paMax (recuperacao por turno = 5), mas o pool acumula ate o teto (9).
 * Assim, uma ficha com 8 PA guardados perdia 3 PA ao ser normalizada.
 *
 * Teste de comportamento: chama a funcao real normalizeCharacter de
 * lib/character/normalize.ts. O max continua 5 (quem le max nao muda).
 *
 * node scripts/verify-pa-guardado-ficha.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function arquivoExistente(base) {
  for (const c of [base, base + ".ts", base + ".tsx", join(base, "index.ts")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let base = null;
    if (specifier.startsWith("@/")) {
      base = join(ROOT, specifier.slice(2));
    } else if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:") &&
      /\.tsx?$/.test(context.parentURL)
    ) {
      base = resolve(dirname(fileURLToPath(context.parentURL)), specifier);
    }
    if (base) {
      const f = arquivoExistente(base);
      if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (/\.json$/.test(url)) {
      const json = readFileSync(fileURLToPath(url), "utf8");
      return { format: "module", source: `export default ${json};`, shortCircuit: true };
    }
    if (/\.tsx?$/.test(url)) {
      const src = readFileSync(fileURLToPath(url), "utf8");
      const out = ts.transpileModule(src, {
        fileName: url,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }).outputText;
      return { format: "module", source: out, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { normalizeCharacter } = await import(
  pathToFileURL(join(ROOT, "lib", "character", "normalize.ts")).href
);
const { applyIdentityPatch } = await import(
  pathToFileURL(join(ROOT, "lib", "character", "identity.ts")).href
);
const { applyStructuredMealToActor } = await import(
  pathToFileURL(join(ROOT, "lib", "culinary", "apply-meal.ts")).href
);
const { paRestoredByMealQuality } = await import(
  pathToFileURL(join(ROOT, "lib", "culinary", "meal-rules.ts")).href
);

let pass = 0;
let fail = 0;

function caso(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    fail++;
    console.error(`  ✗ ${name} — ${err.message.split("\n")[0]}`);
  }
}

/** Ficha minima; normalizeCharacter completa o resto com padroes. */
function ficha(pontosAcao) {
  return {
    id: "p1",
    name: "Teste",
    attributes: {},
    inventory: [],
    resources: {
      vida: { value: 10, max: 10 },
      pontosAcao,
    },
  };
}

console.log("verify-pa-guardado-ficha: D-12 — PA guardado respeita o teto do pool");

caso("PA guardado 8 (acima do max 5, abaixo do teto 9) continua 8", () => {
  const out = normalizeCharacter(ficha({ value: 8, max: 5 }));
  assert.equal(out.resources.pontosAcao.value, 8);
});

caso("PA guardado 12 (acima do teto 9) vira 9", () => {
  const out = normalizeCharacter(ficha({ value: 12, max: 5 }));
  assert.equal(out.resources.pontosAcao.value, 9);
});

caso("campo max continua 5 (recuperacao por turno)", () => {
  const out = normalizeCharacter(ficha({ value: 8, max: 5 }));
  assert.equal(out.resources.pontosAcao.max, 5);
});

caso("applyIdentityPatch: PA guardado 8 continua 8", () => {
  const base = normalizeCharacter(ficha({ value: 5, max: 5 }));
  const out = applyIdentityPatch({ ...base, resources: { ...base.resources, pontosAcao: { value: 8, max: 5 } } }, {});
  assert.equal(out.resources.pontosAcao.value, 8);
});

caso("refeicao com 8 PA guardados continua 8 (comida nao tira PA)", () => {
  const base = normalizeCharacter(ficha({ value: 5, max: 5 }));
  const actor = { ...base, resources: { ...base.resources, pontosAcao: { value: 8, max: 5 } } };
  const r = paRestoredByMealQuality("comum", actor);
  const out = applyStructuredMealToActor(actor, [], "comum", 0, r);
  assert.equal(out.resources.pontosAcao.value, 8);
});

caso("refeicao com 3 PA guardados soma o que paRestoredByMealQuality der, ate 5", () => {
  const base = normalizeCharacter(ficha({ value: 5, max: 5 }));
  const actor = { ...base, resources: { ...base.resources, pontosAcao: { value: 3, max: 5 } } };
  const r = paRestoredByMealQuality("comum", actor);
  assert.equal(r, 1);
  const out = applyStructuredMealToActor(actor, [], "comum", 0, r);
  assert.equal(out.resources.pontosAcao.value, Math.min(5, 3 + r));
  assert.equal(out.resources.pontosAcao.value, 4);
});

caso("applyIdentityPatch: PA guardado 12 vira 9", () => {
  const base = normalizeCharacter(ficha({ value: 5, max: 5 }));
  const out = applyIdentityPatch({ ...base, resources: { ...base.resources, pontosAcao: { value: 12, max: 5 } } }, {});
  assert.equal(out.resources.pontosAcao.value, 9);
});

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
