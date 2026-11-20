/**
 * N-01: a vida temporária (resources.vida.temp) não pode sumir ao normalizar a ficha.
 *
 * Causa: lib/character/normalize.ts, normalizeCharacter, monta resources.vida só com
 * max e value; o campo temp (lib/character/types.ts) é descartado. Por isso a mesa
 * (updateRoomActor -> normalizeCharacter) e saveCharacter perdem a vida temporária.
 *
 * Teste de comportamento: chama a função real normalizeCharacter de
 * lib/character/normalize.ts. Como o arquivo usa imports "@/..." e extensão omitida,
 * o script registra um hook de módulo que resolve esses caminhos e transpila .ts
 * com o pacote typescript do projeto.
 *
 * node scripts/verify-vida-temporaria.mjs
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

/** Ficha mínima; normalizeCharacter completa o resto com padrões. */
function ficha(vida) {
  return {
    id: "p1",
    name: "Teste",
    attributes: {},
    inventory: [],
    resources: {
      vida,
      pontosAcao: { value: 5, max: 5 },
    },
  };
}

console.log("verify-vida-temporaria: N-01 — normalizar a ficha preserva a vida temporária");

caso("vida temporária sobrevive à normalização (temp 4 continua 4)", () => {
  const out = normalizeCharacter(ficha({ value: 15, max: 20, temp: 4 }));
  assert.equal(out.resources.vida.temp, 4);
});

caso("ficha sem vida temporária continua sem vida temporária", () => {
  const out = normalizeCharacter(ficha({ value: 15, max: 20 }));
  assert.equal(out.resources.vida.temp, undefined);
});

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
