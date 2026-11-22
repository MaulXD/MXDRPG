// Ataque de magia soma proficiência para toda classe conjuradora (tabela 17.7 do livro,
// data/character/spell-lists.json), Bruxo e Paladino inclusos. Livro, linha 418:
// "1d20 + Modificador de Atributo + Bonus de Proficiencia (se proficiente)".
// Também a proficiência com arma (BAL-D1, BAL-D3): "todas as armas" e a lista fechada do Mago e do Feiticeiro.
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let n = 0;
const ok = (m) => console.log(`ok ${++n}: ${m}`);

const achar = (b) => [b, b + ".ts", b + ".tsx"].find((c) => existsSync(c) && statSync(c).isFile());
registerHooks({
  resolve(spec, ctx, next) {
    const pai = ctx.parentURL ?? "";
    let base = null;
    if (spec.startsWith("@/")) base = join(root, spec.slice(2));
    else if (spec.startsWith(".") && pai.startsWith("file:") && /\.tsx?$/.test(pai)) base = resolve(dirname(fileURLToPath(pai)), spec);
    if (base) {
      const f = achar(base);
      if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
    }
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (/icones-gerados\.json\?falso$/.test(url)) {
      return { format: "module", source: `export default ${JSON.stringify(manifestoFalso)};`, shortCircuit: true };
    }
    if (/\.json(\?.*)?$/.test(url) && !url.includes("/node_modules/")) {
      return { format: "module", source: `export default ${readFileSync(fileURLToPath(url.split("?")[0]), "utf8")};`, shortCircuit: true };
    }
    if (/\.tsx?(\?.*)?$/.test(url)) {
      const arquivo = fileURLToPath(url.split("?")[0]);
      const out = ts.transpileModule(readFileSync(arquivo, "utf8"), {
        fileName: arquivo,
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      return { format: "module", source: out, shortCircuit: true };
    }
    return next(url, ctx);
  },
});

const { isProficient } = await import(pathToFileURL(join(root, "lib", "combat", "attack.ts")).href);
const dados = JSON.parse(readFileSync(join(root, "data", "character", "spell-lists.json"), "utf8"));
const ator = (classe) => ({ identity: { classe, nivel: 1 } });
const magia = { kind: "spell" };

// 1. Toda classe da tabela 17.7 é proficiente no ataque de magia.
for (const classe of Object.keys(dados.classAccess)) {
  assert.equal(isProficient(ator(classe), magia), true, `${classe} sem proficiência em magia`);
}
assert.ok(Object.keys(dados.classAccess).includes("Bruxo") && Object.keys(dados.classAccess).includes("Paladino"));
ok("Mago, Feiticeiro, Clérigo, Druida, Bardo, Bruxo e Paladino somam proficiência no ataque de magia");

// 2. Quem não conjura continua sem.
for (const classe of ["Guerreiro", "Bárbaro", "Ladino", "Patrulheiro", "Espiritualista"]) {
  assert.equal(isProficient(ator(classe), magia), false, `${classe} não deveria ter proficiência em magia`);
}
ok("Guerreiro, Bárbaro, Ladino, Patrulheiro e Espiritualista seguem sem proficiência em magia");

// 3. BAL-D1: "todas as armas" (Guerreiro, Bárbaro) vale; antes o código procurava "todas armas".
const arma = (name) => ({ kind: "weapon", name });
for (const classe of ["Guerreiro", "Bárbaro"]) {
  for (const nome of ["Machado Grande", "Lâmina de Vinha", "Arco Longo de Vinha", "Montante +2"]) {
    assert.equal(isProficient(ator(classe), arma(nome)), true, `${classe} sem proficiência com ${nome}`);
  }
}
ok("Guerreiro e Bárbaro proficientes com qualquer arma (livro: 'todas as armas')");

// 4. BAL-D3: Mago e Feiticeiro só nas armas da lista do livro (Cap. 4), casadas pelo nome.
const casos = [
  ["Mago", "Adaga de Masmorra", true],
  ["Mago", "Adaga de Masmorra +1", true],
  ["Mago", "Besta Leve", true],
  ["Mago", "Cajado", true],
  ["Mago", "Espada Longa", false],
  ["Mago", "Besta Pesada", false],
  ["Feiticeiro", "Adagas Gêmeas", true],
  ["Feiticeiro", "Besta Leve", true],
  ["Feiticeiro", "Cajado", false],
  ["Feiticeiro", "Machado de Batalha", false],
];
for (const [classe, nome, esperado] of casos) {
  assert.equal(isProficient(ator(classe), arma(nome)), esperado, `${classe} com ${nome}: esperado ${esperado}`);
}
ok("Mago: adaga, besta leve e cajado sim, espada longa não; Feiticeiro: adagas e besta leve sim, cajado não");

// 5. Armas simples e marciais seguem como antes (simples x marcial ainda não separado: BAL-D4, dono).
for (const [classe, nome] of [["Clérigo", "Maça de Guerra"], ["Ladino", "Rapieira"], ["Paladino", "Espada Longa"], ["Bruxo", "Cajado"]]) {
  assert.equal(isProficient(ator(classe), arma(nome)), true, `${classe} com ${nome}`);
}
ok("Clérigo, Ladino, Paladino e Bruxo seguem proficientes como antes");

console.log(`verify-proficiencia-magia: ${n} ok`);
