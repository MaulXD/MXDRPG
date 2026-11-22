/**
 * BAL-D6: o Feiticeiro conjura com Carisma, como manda o livro.
 *
 * Livro (livros/LIVRO-DO-JOGADOR.md, Feiticeiro): "Atributos Primarios: Carisma";
 * "magias conhecidas = nível + CAR". Código: spellcastingAttribute (lib/combat/attack.ts)
 * e computeSpellSaveDc (lib/combat/spell.ts) decidem o atributo de conjuração.
 *
 * Teste de comportamento: chama as funções reais (carregadas com um loader que
 * transpila .ts e resolve o alias "@/"). Não usa regex sobre o código.
 * node scripts/verify-feiticeiro-carisma.mjs
 */
import assert from "node:assert/strict";
import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Loader: resolve "@/..." e imports relativos sem extensão para .ts/.tsx e transpila .ts.
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

const { spellcastingAttribute } = await import(pathToFileURL(join(ROOT, "lib", "combat", "attack.ts")).href);
const { computeSpellSaveDc } = await import(pathToFileURL(join(ROOT, "lib", "combat", "spell.ts")).href);
const { maxPreparedSpells } = await import(pathToFileURL(join(ROOT, "lib", "character", "spell-prep.ts")).href);

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

// Ficha de teste: point-buy do código (CAR 15, INT 8), nível 1 (prof +2).
function fichaFeiticeiro(nivel = 1) {
  return {
    identity: { classe: "Feiticeiro", nivel },
    attributes: { forca: 8, destreza: 15, constituicao: 15, inteligencia: 8, sabedoria: 8, carisma: 15 },
  };
}

caso("Feiticeiro conjura com carisma", () => {
  assert.equal(spellcastingAttribute("Feiticeiro"), "carisma");
});

caso("Mago continua com inteligencia", () => {
  assert.equal(spellcastingAttribute("Mago"), "inteligencia");
});

caso("Clerigo e Druida continuam com sabedoria", () => {
  assert.equal(spellcastingAttribute("Clérigo"), "sabedoria");
  assert.equal(spellcastingAttribute("Druida"), "sabedoria");
});

caso("Bardo, Paladino e Bruxo continuam com carisma", () => {
  assert.equal(spellcastingAttribute("Bardo"), "carisma");
  assert.equal(spellcastingAttribute("Paladino"), "carisma");
  assert.equal(spellcastingAttribute("Bruxo"), "carisma");
});

caso("CD de magia do Feiticeiro usa carisma: 8 + prof 2 + CAR +2 = 12", () => {
  const dc = computeSpellSaveDc(fichaFeiticeiro(1), { name: "Mao Gelidas", kind: "spell" });
  assert.equal(dc, 12);
});

caso("CD do Feiticeiro nao usa a inteligencia (que daria 9)", () => {
  const dc = computeSpellSaveDc(fichaFeiticeiro(1), { name: "Mao Gelidas", kind: "spell" });
  assert.notEqual(dc, 9);
});

// BAL-D6b: magias conhecidas do Feiticeiro = nivel + CAR, minimo 2 (livros/LIVRO-DO-JOGADOR.md:1142).
function fichaComCar(classe, nivel, carisma) {
  return {
    identity: { classe, nivel },
    attributes: { forca: 8, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, carisma },
  };
}

caso("Feiticeiro nv1 CAR 15 conhece 3 magias (nivel + CAR)", () => {
  assert.equal(maxPreparedSpells(fichaComCar("Feiticeiro", 1, 15)), 3);
});

caso("Feiticeiro nv3 CAR 15 conhece 5 magias (nao a tabela 2 + nivel - 1)", () => {
  assert.equal(maxPreparedSpells(fichaComCar("Feiticeiro", 3, 15)), 5);
});

caso("Feiticeiro nv5 CAR 15 conhece 7 magias", () => {
  assert.equal(maxPreparedSpells(fichaComCar("Feiticeiro", 5, 15)), 7);
});

caso("Feiticeiro nv1 CAR 8 (mod -1) respeita o minimo de 2", () => {
  assert.equal(maxPreparedSpells(fichaComCar("Feiticeiro", 1, 8)), 2);
});

// 22/11: o Paladino tambem conjura com Carisma; o limite de preparadas usava Sabedoria.
caso("Paladino nv4 CAR 16 (SAB 10) prepara 2 + 3 = 5 magias, pelo Carisma", () => {
  assert.equal(maxPreparedSpells(fichaComCar("Paladino", 4, 16)), 5);
});

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
