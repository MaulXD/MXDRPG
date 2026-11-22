// D-21 (a), BV-056: traços de classe do livro (Cap. 4) aparecem só leitura na aba Habilidades.
// data/character/class-traits.json sai de scripts/generate-class-traits.mjs (sync:data).
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
    if (/\.json$/.test(url) && !url.includes("/node_modules/")) {
      return { format: "module", source: `export default ${readFileSync(fileURLToPath(url), "utf8")};`, shortCircuit: true };
    }
    if (/\.tsx?$/.test(url)) {
      const arquivo = fileURLToPath(url);
      const out = ts.transpileModule(readFileSync(arquivo, "utf8"), {
        fileName: arquivo,
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText;
      return { format: "module", source: out, shortCircuit: true };
    }
    return next(url, ctx);
  },
});

const { extrairTracos } = await import(pathToFileURL(join(root, "scripts", "generate-class-traits.mjs")).href);
const livro = readFileSync(join(root, "livros", "LIVRO-DO-JOGADOR.md"), "utf8");
const gravado = JSON.parse(readFileSync(join(root, "data", "character", "class-traits.json"), "utf8"));

// 1. O JSON gravado é o que o gerador tira do livro hoje (rode npm run sync:data se falhar).
assert.deepEqual(gravado.classes, extrairTracos(livro), "class-traits.json desatualizado: rode npm run sync:data");
ok("data/character/class-traits.json bate com o Cap. 4 do livro");

// 2. As 12 classes e os traços que o BV-056 cobrou.
const c = gravado.classes;
assert.equal(Object.keys(c).length, 12);
const tem = (classe, nome, nivel) =>
  assert.ok(c[classe].some((t) => t.nome === nome && t.nivel === nivel), `${classe} sem ${nome} (nv ${nivel})`);
tem("Guerreiro", "Segundo Folego", 1);
tem("Guerreiro", "Golpe de Veterano", 14);
tem("Ladino", "Ataque Furtivo", 1);
tem("Bárbaro", "Furia", 1);
tem("Espiritualista", "Chi", 1);
tem("Paladino", "Golpe Sagrado", 2);
tem("Bruxo", "Raio do Pacto", 1);
for (const [classe, lista] of Object.entries(c)) {
  for (const t of lista) {
    assert.ok(!/^(PA( |$)|Tabela|Habilidades Base|Bônus Passivo|Subclasses)/.test(t.nome), `${classe}: ${t.nome} não é traço`);
    assert.ok(t.texto.length > 10 && !t.texto.includes("**"), `${classe}: texto de ${t.nome} vazio ou com markdown`);
  }
}
ok("12 classes; Segundo Fôlego, Ataque Furtivo, Fúria, Chi, Golpe Sagrado e Raio do Pacto presentes; sem notas de PA nem subclasses");

// 3. A ficha só mostra o que o nível já dá.
const { classTraitsForLevel } = await import(pathToFileURL(join(root, "lib", "character", "class-traits.ts")).href);
const nomes = (classe, nivel) => classTraitsForLevel(classe, nivel).map((t) => t.nome);
assert.ok(nomes("Guerreiro", 1).includes("Segundo Folego"));
assert.ok(!nomes("Guerreiro", 13).includes("Golpe de Veterano"));
assert.ok(nomes("Guerreiro", 14).includes("Golpe de Veterano"));
assert.ok(!nomes("Paladino", 1).includes("Golpe Sagrado"));
assert.ok(nomes("Paladino", 2).includes("Golpe Sagrado"));
assert.deepEqual(nomes("Classe Inexistente", 5), []);
ok("classTraitsForLevel filtra pelo nível (Golpe de Veterano só no 14, Golpe Sagrado só no 2)");

// 4. A aba Habilidades da ficha usa a seção.
const ficha = readFileSync(join(root, "components", "character", "CharacterSheet.tsx"), "utf8");
assert.match(ficha, /tab === "habilidades" \? \(\s*<ClassTraitsSection classe=\{live\.identity\.classe\} nivel=\{live\.identity\.nivel\} \/>/);
assert.match(readFileSync(join(root, "package.json"), "utf8"), /node scripts\/generate-class-traits\.mjs/);
ok("aba Habilidades mostra ClassTraitsSection e o gerador está no sync:data");

console.log(`verify-tracos-classe: ${n} ok`);
