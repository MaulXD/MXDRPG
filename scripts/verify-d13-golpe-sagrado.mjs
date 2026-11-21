/**
 * D13: Golpe Sagrado do Paladino (livros/LIVRO-DO-JOGADOR.md, linhas 1199 a 1203 e 1210).
 * Livro: 1 PA extra, ao acertar ataque corpo a corpo com arma, +2d8 radiante no nivel 2,
 * escala 3d8 no 5, 4d8 no 9, 5d8 no 13 e 6d8 no 17.
 * Antes: o motor dava +2 no teste de ataque (ramo melee_attack_bonus com selfTarget) e o
 * nome era "Golpe do Juramento". Agora: nome do livro e buff de dano radiante por nivel,
 * no campo bonusDamageFormula, consumido no proximo ataque que acertar.
 * Resistencia: o dado radiante do Golpe Sagrado resiste como radiante, separado do tipo da arma
 * (bonusDamageType). Fora de escopo (sem teste aqui): morto-vivo.
 *
 * Codigo: lib/combat/golpe-sagrado.ts (escala), lib/combat/ability.ts (buff),
 * lib/combat/attack.ts (dano extra e consumo), lib/character/rules.ts (nome).
 * Teste de comportamento: chama as funcoes reais (loader que transpila .ts e resolve "@/").
 * Acerto forcado: repete o ataque ate acertar sem critico, como o verify-d11.
 * node scripts/verify-d13-golpe-sagrado.mjs
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

const { resolveAttack, attackerAfterAttack } = await import(
  pathToFileURL(join(ROOT, "lib", "combat", "attack.ts")).href
);
const { resolveAbilityUse } = await import(pathToFileURL(join(ROOT, "lib", "combat", "ability.ts")).href);
const { golpeSagradoDiceForLevel } = await import(pathToFileURL(join(ROOT, "lib", "combat", "golpe-sagrado.ts")).href);
const { classLevelFeatures } = await import(pathToFileURL(join(ROOT, "lib", "character", "rules.ts")).href);

// Turno de combate ativo (mesmo padrao do verify-d11).
const TURNO = { combatActive: true, combatHasOrder: true, bypassTurn: true, combatRound: 1 };
const OPTS = { skipPaCheck: true, skipRangeCheck: true };

// Acao de arma corpo a corpo: 1d6 perfurante, sem bonus de atributo.
const acao = {
  packId: "armas",
  entryId: "teste-d13",
  name: "Espada de teste",
  kind: "weapon",
  resolution: "attack",
  damageFormula: "1d6",
  damageType: "cortante",
  attackBonus: 0,
  rangeCells: 1,
  paCost: 1,
  label: "Espada de teste",
};

// Acao do Golpe Sagrado como sai do compendio: habilidade, self, efeito melee_attack_bonus.
const golpeSagrado = {
  packId: "habilidades",
  entryId: "habilidades-golpe-sagrado",
  name: "Golpe Sagrado",
  kind: "ability",
  resolution: "attack",
  damageFormula: "0",
  damageType: "radiante",
  attackBonus: 0,
  rangeCells: 1,
  paCost: 1,
  label: "Golpe Sagrado",
  abilityEffect: "melee_attack_bonus",
  selfTarget: true,
  bonusDamageFormula: "2d8",
};

// Lamina dos Sepulcros: mesmo ramo generico (melee_attack_bonus + selfTarget), nao pode mudar.
const laminaSepulcros = {
  ...golpeSagrado,
  entryId: "habilidades-lamina-dos-sepulcros",
  name: "Lâmina dos Sepulcros",
  damageType: "radiante",
  bonusDamageFormula: "1d8",
};

function ficha(classe, nivel) {
  return {
    name: "Paladino",
    identity: { classe, nivel },
    attributes: { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, carisma: 10 },
    proficiencies: [],
    resources: {},
  };
}

const paladinoBase = {
  id: "pal",
  name: "Paladino",
  axial: { q: 0, r: 0 },
  vida: 40,
  vidaMax: 40,
  defesa: 10,
  pa: 10,
  paMax: 10,
};
const alvo = {
  id: "alvo",
  name: "Goblin",
  axial: { q: 1, r: 0 },
  vida: 500,
  vidaMax: 500,
  defesa: 1,
  monsterEntryId: "monstros-goblin",
};

// Um acerto sem critico: repete ate acertar (alvo com CA 1 acerta quase sempre).
function golpe(atacante, actor, action = acao) {
  for (let i = 0; i < 500; i++) {
    const res = resolveAttack(atacante, alvo, actor, action, undefined, undefined, [atacante, alvo], OPTS);
    if (res.hit && res.damage && !res.critical) return res;
  }
  throw new Error("nao acertou em 500 tentativas");
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

console.log("D13 - Golpe Sagrado do Paladino");

caso("golpeSagradoDiceForLevel segue a tabela do livro (2d8, 3d8, 4d8, 5d8, 6d8)", () => {
  assert.equal(golpeSagradoDiceForLevel(1), "2d8");
  assert.equal(golpeSagradoDiceForLevel(2), "2d8");
  assert.equal(golpeSagradoDiceForLevel(4), "2d8");
  assert.equal(golpeSagradoDiceForLevel(5), "3d8");
  assert.equal(golpeSagradoDiceForLevel(8), "3d8");
  assert.equal(golpeSagradoDiceForLevel(9), "4d8");
  assert.equal(golpeSagradoDiceForLevel(12), "4d8");
  assert.equal(golpeSagradoDiceForLevel(13), "5d8");
  assert.equal(golpeSagradoDiceForLevel(16), "5d8");
  assert.equal(golpeSagradoDiceForLevel(17), "6d8");
  assert.equal(golpeSagradoDiceForLevel(20), "6d8");
});

caso("classLevelFeatures(Paladino) usa o nome do livro e nao o antigo", () => {
  const txt = [2, 5, 9, 13, 17].map((n) => classLevelFeatures("Paladino", n).join(" | ")).join(" | ");
  assert.doesNotMatch(txt, /Golpe do Juramento/);
  assert.match(classLevelFeatures("Paladino", 2).join(" | "), /Golpe Sagrado — \+2d8 radiante/);
  assert.match(classLevelFeatures("Paladino", 5).join(" | "), /Golpe Sagrado — 3d8 radiante/);
  assert.match(classLevelFeatures("Paladino", 17).join(" | "), /Golpe Sagrado — 6d8 radiante/);
});

caso("usar Golpe Sagrado no nivel 5 prepara 3d8 radiante no token, sem +2 de ataque", () => {
  const res = resolveAbilityUse(paladinoBase, null, ficha("Paladino", 5), golpeSagrado, [paladinoBase], TURNO);
  assert.equal(res.kind, "buff", JSON.stringify(res).slice(0, 300));
  assert.equal(res.attackerUpdate.bonusDamageFormula, "3d8");
  assert.equal(res.attackerUpdate.bonusDamageType, "radiante");
  assert.equal("nextAttackBonus" in res.attackerUpdate, false);
  assert.match(res.summary, /\+3d8 radiante/);
});

caso("usar Golpe Sagrado no nivel 2 prepara 2d8 radiante", () => {
  const res = resolveAbilityUse(paladinoBase, null, ficha("Paladino", 2), golpeSagrado, [paladinoBase], TURNO);
  assert.equal(res.attackerUpdate.bonusDamageFormula, "2d8");
});

caso("Lamina dos Sepulcros continua com +2 no ataque, sem dano novo", () => {
  const res = resolveAbilityUse(paladinoBase, null, ficha("Paladino", 5), laminaSepulcros, [paladinoBase], TURNO);
  assert.equal(res.attackerUpdate.nextAttackBonus, 2);
  assert.equal("bonusDamageFormula" in res.attackerUpdate, false);
});

caso("ataque com Golpe Sagrado preparado soma o dado radiante ao dano (acerto forcado)", () => {
  const preparado = { ...paladinoBase, bonusDamageFormula: "3d8" };
  const semBuff = golpe(paladinoBase, ficha("Paladino", 5));
  const comBuff = golpe(preparado, ficha("Paladino", 5));
  assert.equal(semBuff.damage.rolls.length, 1, "sem buff: so o 1d6 da arma");
  assert.equal(comBuff.damage.rolls.length, 4, `com buff: 1d6 + 3d8 (${comBuff.damage.rolls.length} rolagens)`);
  assert.ok(comBuff.damage.total >= 4, `total com buff: ${comBuff.damage.total}`);
});

caso("o buff so sai no ataque que acerta (miss mantem, hit consome)", () => {
  const preparado = { ...paladinoBase, bonusDamageFormula: "3d8" };
  const acertou = attackerAfterAttack(preparado, acao, false, false, true);
  const errou = attackerAfterAttack(preparado, acao, false, false, false);
  assert.ok("bonusDamageFormula" in acertou, "acerto deveria limpar o buff");
  assert.equal(acertou.bonusDamageFormula, undefined);
  assert.equal("bonusDamageFormula" in errou, false, "erro nao deveria mexer no buff");
});

// Ataque contra um defensor com resistencias (damageResist): acerto sem critico.
function ataqueContra(atacante, defensor, actor) {
  for (let i = 0; i < 500; i++) {
    const res = resolveAttack(atacante, defensor, actor, acao, undefined, undefined, [atacante, defensor], OPTS);
    if (res.hit && res.damage && !res.critical) return res;
  }
  throw new Error("nao acertou em 500 tentativas");
}
// Separa o dano: os ultimos `dados` rolls sao o Golpe Sagrado (o Paladino nao tem furtivo).
function separaGolpe(res, dados) {
  const golpe = res.damage.rolls.slice(-dados).reduce((a, b) => a + b, 0);
  return { golpe, arma: res.damage.total - golpe, perda: res.defenderHpBefore - res.defenderHpAfter };
}

caso("Golpe Sagrado sem resistencia: a perda e o total da arma mais o radiante inteiro", () => {
  const preparado = { ...paladinoBase, bonusDamageFormula: "3d8", bonusDamageType: "radiante" };
  const { golpe, arma, perda } = separaGolpe(ataqueContra(preparado, alvo, ficha("Paladino", 5)), 3);
  assert.equal(perda, arma + golpe);
});

caso("Golpe Sagrado: defensor resiste a cortante; o radiante nao cai pela metade", () => {
  const defensor = { ...alvo, damageResist: ["cortante"] };
  const preparado = { ...paladinoBase, bonusDamageFormula: "3d8", bonusDamageType: "radiante" };
  const { golpe, arma, perda } = separaGolpe(ataqueContra(preparado, defensor, ficha("Paladino", 5)), 3);
  assert.equal(perda, Math.floor(arma / 2) + golpe, `arma ${arma}, golpe ${golpe}, perda ${perda}`);
});

caso("Golpe Sagrado: defensor resiste a radiante; so o radiante cai pela metade", () => {
  const defensor = { ...alvo, damageResist: ["radiante"] };
  const preparado = { ...paladinoBase, bonusDamageFormula: "3d8", bonusDamageType: "radiante" };
  const { golpe, arma, perda } = separaGolpe(ataqueContra(preparado, defensor, ficha("Paladino", 5)), 3);
  assert.equal(perda, arma + Math.floor(golpe / 2), `arma ${arma}, golpe ${golpe}, perda ${perda}`);
});

console.log(`\nverify-d13-golpe-sagrado: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
