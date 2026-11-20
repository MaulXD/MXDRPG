/**
 * A-22: a descrição do compêndio não pode levar <script> nem atributos de evento (onerror=)
 * para dangerouslySetInnerHTML. Causa: CompendiumBrowser.tsx passava entry.system.description
 * direto. Correção: sanitizeCompendiumHtml (lib/compendium/format.ts), lista branca de tags sem atributos.
 *
 * A-23: .btn-primary e .btn-primary-cta são iguais e a toolbar da ficha (sheet-ddb.css) só
 * isentava .btn-primary-cta. Correção: isentar os dois nas duas regras (normal e :hover).
 *
 * node scripts/verify-a22-a23-sanitize-botoes.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

registerHooks({
  load(url, context, nextLoad) {
    if (/\.tsx?$/.test(url)) {
      const src = readFileSync(fileURLToPath(url), "utf8");
      const out = ts.transpileModule(src, {
        fileName: url,
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      return { format: "module", source: out, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { sanitizeCompendiumHtml } = await import(
  pathToFileURL(join(ROOT, "lib", "compendium", "format.ts")).href
);

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log("OK  ", name);
  } catch (e) {
    fail++;
    console.log("FAIL", name, "-", e.message.split("\n")[0]);
  }
}

const malicioso = `<p onclick="x()">Texto</p><script>alert(1)</script><img src=x onerror=alert(2)>` +
  `<a href="javascript:alert(3)">link</a><iframe src="evil"></iframe><style>body{}</style>`;
const limpo = sanitizeCompendiumHtml(malicioso);

check("A-22: <script> some da descrição", () => {
  assert.doesNotMatch(limpo, /<script/i);
  assert.doesNotMatch(limpo, /alert\(1\)/);
});

check("A-22: onerror= some da descrição", () => {
  assert.doesNotMatch(limpo, /onerror=/i);
  assert.doesNotMatch(limpo, /onclick=/i);
});

check("A-22: tags fora da lista branca somem (img, a, iframe, style)", () => {
  assert.doesNotMatch(limpo, /<(img|a|iframe|style)\b/i);
  assert.doesNotMatch(limpo, /javascript:/i);
});

check("A-22: tags da lista branca ficam, sem atributos", () => {
  assert.equal(sanitizeCompendiumHtml('<p class="x">Oi</p>'), "<p>Oi</p>");
  assert.equal(
    sanitizeCompendiumHtml('<h3>T</h3><table><tr><td style="x">1</td><th>2</th></tr></table>'),
    "<h3>T</h3><table><tr><td>1</td><th>2</th></tr></table>",
  );
  assert.equal(sanitizeCompendiumHtml("<ul><li>a</li></ul><br/><strong>b</strong>"), "<ul><li>a</li></ul><br><strong>b</strong>");
});

check("A-22: '<' solto vira &lt; e texto comum passa", () => {
  assert.equal(sanitizeCompendiumHtml("PA 2 < 3 e Alcance 4"), "PA 2 &lt; 3 e Alcance 4");
  assert.equal(sanitizeCompendiumHtml("Dano &amp; cura"), "Dano &amp; cura");
});

check("A-22: CompendiumBrowser passa a descrição pelo sanitizador", () => {
  const comp = read("components/compendium/CompendiumBrowser.tsx");
  assert.match(comp, /const html = sanitizeCompendiumHtml\(/);
  assert.match(comp, /dangerouslySetInnerHTML=\{\{ __html: html \}\}/);
});

const css = read("components/character/sheet-ddb.css");
const regrasA23 = [
  ".sheet-shell--ddb .sheet-toolbar .btn:not(.btn-primary):not(.btn-primary-cta):not(.btn--level-ready) {",
  ".sheet-shell--ddb .sheet-toolbar .btn:not(.btn-primary):not(.btn-primary-cta):not(.btn--level-ready):hover {",
];

for (const regra of regrasA23) {
  check(`A-23: isenta .btn-primary e .btn-primary-cta em ${regra.slice(-12)}`, () => {
    assert.ok(css.includes(regra), `regra não encontrada: ${regra}`);
  });
}

check("A-23: nenhuma regra da toolbar isenta só o -cta", () => {
  assert.doesNotMatch(css, /sheet-toolbar \.btn:not\(\.btn-primary-cta\)/);
});

console.log(`\n${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
