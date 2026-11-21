// Ícones com arte nos cartões de classe do criador de personagens.
// Sem arte gerada, o cartão mostra o glifo de sempre (nenhum pedido a arquivo que falta).
// Com arte (manifesto lib/icons/icones-gerados.json escrito pelo compor.mjs), mostra a imagem emoldurada.
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, statSync, rmSync } from "node:fs";
import { registerHooks } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8");
let n = 0;
const ok = (m) => console.log(`ok ${++n}: ${m}`);

// Manifesto falso só para este teste (o real começa vazio).
let manifestoFalso = null;
const achar = (b) => [b, b + ".ts", b + ".tsx"].find((c) => existsSync(c) && statSync(c).isFile());
registerHooks({
  resolve(spec, ctx, next) {
    const pai = ctx.parentURL ?? "";
    let base = null;
    if (spec.startsWith("@/")) base = join(root, spec.slice(2));
    else if (spec.startsWith(".") && pai.startsWith("file:") && /\.tsx?$/.test(pai)) base = resolve(dirname(fileURLToPath(pai)), spec);
    if (base) {
      const f = achar(base);
      if (f) return { url: pathToFileURL(f).href + (manifestoFalso && f.endsWith(".json") ? "?falso" : ""), shortCircuit: true };
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

const urlIcones = pathToFileURL(join(root, "lib", "icons", "catalog-icons.ts")).href;

// 1. Ids batem com o lote de prompts das classes.
const real = await import(urlIcones);
const lote = JSON.parse(ler("docs/icones/prompts-classes.json"));
const idsClasse = lote.filter((i) => i.tipo === "Classe").map((i) => i.id);
assert.equal(idsClasse.length, 12, "lote de prompts deveria ter 12 classes");
for (const i of lote.filter((x) => x.tipo === "Classe")) {
  assert.equal(real.classeIconeId(i.classe), i.id, `classeIconeId(${i.classe})`);
}
assert.equal(real.classeIconeId("Clérigo"), "CLA-clerigo");
ok("classeIconeId bate com os 12 ids de docs/icones/prompts-classes.json (sem acento)");

// 2. Manifesto real (sem arte ainda): nenhuma URL, o cartão fica com o glifo.
const manifestoReal = JSON.parse(ler("lib/icons/icones-gerados.json"));
for (const id of idsClasse) {
  const esperado = manifestoReal.classes.includes(id) ? `/icons/classes/${id}.webp` : null;
  assert.equal(real.iconeGeradoUrl("classes", id), esperado, `URL de ${id}`);
  if (esperado) assert.ok(existsSync(join(root, "public", "icons", "classes", `${id}.webp`)), `manifesto lista ${id} sem o .webp`);
}
ok(`manifesto real coerente com public/icons (${manifestoReal.classes.length} classes com arte)`);

// 3. Com arte no manifesto: devolve a URL só do que existe.
manifestoFalso = { classes: ["CLA-mago"], habilidades: [], magias: [] };
const falso = await import(urlIcones + "?falso");
assert.equal(falso.iconeGeradoUrl("classes", "CLA-mago"), "/icons/classes/CLA-mago.webp");
assert.equal(falso.iconeGeradoUrl("classes", "CLA-bruxo"), null);
assert.equal(falso.iconeGeradoUrl("magias", "CLA-mago"), null);
ok("com CLA-mago no manifesto: URL do Mago, nada para o Bruxo nem para outra categoria");

// 4. O cartão de classe usa a arte e o componente troca o glifo pela imagem.
const wizard = ler("components/character/wizard/CharacterCreationWizard.tsx");
assert.match(wizard, /artSrc=\{iconeGeradoUrl\("classes", classeIconeId\(c\.id\)\)\}/, "cartão de classe sem artSrc");
const pick = ler("components/character/wizard/WizardPickIcon.tsx");
assert.match(pick, /if \(artSrc\) \{/, "WizardPickIcon não checa artSrc");
assert.match(pick, /char-wizard-pick__icon--art/, "WizardPickIcon sem a classe --art");
assert.match(pick, /<img src=\{artSrc\}/, "WizardPickIcon não mostra a imagem");
assert.match(ler("components/character/wizard/wizard.css"), /\.char-wizard-pick__icon--art img \{/, "CSS do ícone com arte ausente");
ok("cartão de classe passa artSrc e o WizardPickIcon mostra <img> com a classe --art");

// 5. compor.mjs escreve o manifesto com o que existe na pasta de saída.
const { atualizarManifesto } = await import(pathToFileURL(join(root, "scripts", "icones", "compor.mjs")).href);
const tmp = mkdtempSync(join(tmpdir(), "icones-"));
try {
  const saida = join(tmp, "classes");
  mkdirSync(saida);
  writeFileSync(join(saida, "CLA-mago.webp"), "x");
  writeFileSync(join(saida, "CLA-desconhecida.webp"), "x");
  const arquivo = join(tmp, "icones-gerados.json");
  writeFileSync(arquivo, JSON.stringify({ classes: [], habilidades: [], magias: ["MAG-sono"] }));
  atualizarManifesto("classes", saida, new Map([["CLA-mago", {}], ["CLA-bruxo", {}]]), arquivo);
  const escrito = JSON.parse(readFileSync(arquivo, "utf8"));
  assert.deepEqual(escrito.classes, ["CLA-mago"], "manifesto deveria ter só o webp com id conhecido");
  assert.deepEqual(escrito.magias, ["MAG-sono"], "manifesto apagou outra categoria");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
ok("atualizarManifesto lista só os .webp com id conhecido e preserva as outras categorias");

console.log(`verify-icones-cartoes: ${n} ok`);
