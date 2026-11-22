// Auditoria 08/2026, item 8: assimilações culinárias expiram (expiresAt de 24 h gravado pela refeição).
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

const { unexpiredAssimilations } = await import(pathToFileURL(join(root, "lib", "culinary", "types.ts")).href);
const { normalizeCharacter } = await import(pathToFileURL(join(root, "lib", "character", "normalize.ts")).href);
const { buildCharacterFromWizard } = await import(pathToFileURL(join(root, "lib", "character", "build-from-wizard.ts")).href);

const agora = Date.now();
const HORA = 60 * 60 * 1000;
const assim = (entryId, expiresAt) => ({
  entryId,
  name: entryId,
  effectLabel: "efeito",
  specimenCatalogId: "MON-001",
  acquiredAt: agora - 25 * HORA,
  expiresAt,
});
const vencida = assim("assim-001-1", agora - HORA);
const valendo = assim("assim-001-2", agora + HORA);
const semPrazo = assim("assim-001-3", null);

// 1. Função pura.
assert.deepEqual(
  unexpiredAssimilations([vencida, valendo, semPrazo], agora).map((a) => a.entryId),
  ["assim-001-2", "assim-001-3"]
);
assert.deepEqual(unexpiredAssimilations([], agora), []);
ok("unexpiredAssimilations tira a vencida e mantém a que vale e a sem prazo (até descanso longo)");

// 2. A normalização da ficha (usada ao ler e gravar) poda a vencida.
const draft = {
  name: "Teste Assimilacao",
  biography: "",
  raca: "Humano",
  linhagem: null,
  classe: "Guerreiro",
  antecedente: "Explorador",
  starterKitId: "guerreiro-lamina",
  religiao: "Sem Deus",
  pointBuy: { forca: 15, destreza: 15, constituicao: 13, inteligencia: 10, sabedoria: 10, carisma: 8 },
};
const ficha = buildCharacterFromWizard("u-teste", draft);
const comAssim = {
  ...ficha,
  culinaryProgress: { ...ficha.culinaryProgress, activeAssimilations: [vencida, valendo, semPrazo] },
};
const normal = normalizeCharacter(comAssim);
assert.deepEqual(
  normal.culinaryProgress.activeAssimilations.map((a) => a.entryId),
  ["assim-001-2", "assim-001-3"]
);
ok("normalizeCharacter poda a assimilação vencida da ficha");

// 3. A ficha (popup) também filtra ao mostrar.
const popup = readFileSync(join(root, "components", "character", "SheetPopupDdbView.tsx"), "utf8");
assert.match(popup, /unexpiredAssimilations\(character\.culinaryProgress\?\.activeAssimilations \?\? \[\]\)\.map/);
ok("SheetPopupDdbView lista só as assimilações que ainda valem");

console.log(`verify-assimilacao-expira: ${n} ok`);
