/**
 * D-11: arma aprimorada (+N) soma N ao acerto e ao dano; arma comum soma 0.
 *
 * Texto do catalogo (data/compendiums/armas.json): "Aprimoramento +2: soma +2 ao ataque
 * e +2 ao dano". Dado: system.enchant e system.weapon.ataque.bonus.
 * Codigo: actionFromEntry, rollActionDamage (lib/combat/attack.ts) e entrySummary
 * (lib/compendium/format.ts, chip do compendio).
 *
 * Teste de comportamento: chama as funcoes reais (loader que transpila .ts e resolve "@/").
 * node scripts/verify-arma-aprimorada.mjs
 */
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";
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

const { actionFromEntry, rollActionDamage, formatAttackChatDetail } = await import(
  pathToFileURL(join(ROOT, "lib", "combat", "attack.ts")).href
);
const { entrySummary } = await import(pathToFileURL(join(ROOT, "lib", "compendium", "format.ts")).href);

const raw = JSON.parse(readFileSync(join(ROOT, "data", "compendiums", "armas.json"), "utf8"));
const lista = Array.isArray(raw) ? raw : (Object.values(raw).find(Array.isArray) ?? []);
function entrada(nome) {
  const e = lista.find((x) => x.name === nome);
  assert.ok(e, `entrada "${nome}" nao encontrada em armas.json`);
  return e;
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

const adagaComum = entrada("Adaga de Masmorra");
const adaga2 = entrada("Adaga de Masmorra +2");
const adaga3 = entrada("Adaga de Masmorra +3");

const acaoComum = actionFromEntry(adagaComum, "armas");
const acao2 = actionFromEntry(adaga2, "armas");
const acao3 = actionFromEntry(adaga3, "armas");

caso("Adaga +2 soma 2 ao acerto (attackBonus = 2)", () => {
  assert.equal(acao2.attackBonus, 2);
});

caso("Adaga +2 soma 2 ao dano (damageBonus = 2)", () => {
  assert.equal(acao2.damageBonus, 2);
});

caso("Adaga +3 soma 3 ao acerto e ao dano", () => {
  assert.equal(acao3.attackBonus, 3);
  assert.equal(acao3.damageBonus, 3);
});

caso("Adaga comum soma 0 ao acerto e ao dano", () => {
  assert.equal(acaoComum.attackBonus, 0);
  assert.equal(acaoComum.damageBonus, 0);
});

caso("dano da Adaga +2 = dados + 2 (200 rolagens normais)", () => {
  for (let i = 0; i < 200; i++) {
    const d = rollActionDamage(acao2.damageFormula, 0, false, acao2.damageBonus);
    const soma = d.rolls.reduce((a, b) => a + b, 0);
    assert.equal(d.total - soma, 2);
  }
});

caso("dano da Adaga +2 no critico: +2 entra uma vez (nao dobra)", () => {
  for (let i = 0; i < 200; i++) {
    const d = rollActionDamage(acao2.damageFormula, 0, true, acao2.damageBonus);
    assert.equal(d.rolls.length, 2);
    const soma = d.rolls.reduce((a, b) => a + b, 0);
    assert.equal(d.total - soma, 2);
  }
});

caso("dano da Adaga comum = so os dados (sem bonus)", () => {
  for (let i = 0; i < 200; i++) {
    const d = rollActionDamage(acaoComum.damageFormula, 0, false, acaoComum.damageBonus);
    const soma = d.rolls.reduce((a, b) => a + b, 0);
    assert.equal(d.total - soma, 0);
  }
});

function resolucaoComDano(damage) {
  return {
    actionKind: "weapon",
    attack: { natural: 12, attributeMod: 0, profBonus: 0, weaponBonus: 2, total: 14 },
    defenderAc: 12,
    hit: true,
    damage,
    summary: "Teste acerta alvo: 14 vs CA 12 — dano",
    defenderHpBefore: 10,
    defenderHpAfter: 5,
  };
}

caso("linha de dano do chat mostra o +2 (Dano 3+2 = 5)", () => {
  const dano = { formula: "1d4", rolls: [3], attributeMod: 0, flatBonus: 2, total: 5, doubled: false };
  const txt = formatAttackChatDetail(resolucaoComDano(dano));
  assert.ok(txt.includes("Dano 3+2 = 5"), `texto: ${txt}`);
});

caso("linha de dano do chat com dano real da Adaga +2 mostra +2 e o total", () => {
  const dano = rollActionDamage(acao2.damageFormula, 0, false, acao2.damageBonus);
  const txt = formatAttackChatDetail(resolucaoComDano(dano));
  assert.ok(txt.includes(`+2 = ${dano.total}`), `texto: ${txt}`);
});

caso("linha de dano do chat da Adaga comum nao mostra +N", () => {
  const dano = rollActionDamage(acaoComum.damageFormula, 0, false, acaoComum.damageBonus);
  const txt = formatAttackChatDetail(resolucaoComDano(dano));
  assert.ok(!/Dano \d+\+\d+ =/.test(txt), `texto: ${txt}`);
});

caso("chip do compendio mostra Dano 1d4+2 na Adaga +2", () => {
  const linhas = entrySummary(adaga2.system, adaga2.type);
  assert.ok(
    linhas.some((l) => l.startsWith("Dano 1d4+2")),
    `linhas: ${JSON.stringify(linhas)}`
  );
});

caso("chip do compendio segue Dano 1d4 na Adaga comum", () => {
  const linhas = entrySummary(adagaComum.system, adagaComum.type);
  assert.ok(
    linhas.some((l) => l.startsWith("Dano 1d4") && !l.includes("+")),
    `linhas: ${JSON.stringify(linhas)}`
  );
});

console.log(`\nverify-arma-aprimorada: ${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
