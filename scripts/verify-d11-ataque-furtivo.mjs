/**
 * D11: Ataque Furtivo do Ladino jogador (livros/LIVRO-DO-JOGADOR.md, linha 994).
 * Ataca com Vantagem ou com aliado adjacente ao alvo: +Nd6, N = 1 no nivel 1 ate 10 no 20.
 * Decisoes do dono (pagina 03 do fichario, D11):
 * - so em ataque com arma (kind "weapon"), nunca em magia de area, habilidade ou desarmado;
 * - no maximo uma vez por turno do Ladino (token.sneakAttackUsedThisTurn, zerado no inicio do turno);
 * - no critico o dado rola de novo (livro, linha 421, "dano dobrado").
 * So Ladino recebe. Dano extra entra antes da resistencia e aparece no chat.
 *
 * Codigo: lib/combat/sneak-attack.ts (helper), lib/combat/attack.ts (resolveAttack,
 * attackerAfterAttack, formatAttackChatDetail), lib/combat/pa-turn-discount.ts (zerar no turno),
 * lib/character/rules.ts (classLevelFeatures).
 *
 * Teste de comportamento: chama as funcoes reais (loader que transpila .ts e resolve "@/").
 * node scripts/verify-d11-ataque-furtivo.mjs
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

const { resolveAttack, resolveMultiAttack, formatAttackChatDetail, attackerAfterAttack } = await import(
  pathToFileURL(join(ROOT, "lib", "combat", "attack.ts")).href
);
const { sneakAttackDiceForLevel, sneakAttackFormula, sneakAttackTurnWindow } = await import(
  pathToFileURL(join(ROOT, "lib", "combat", "sneak-attack.ts")).href
);
const { clearPaDiscountUsed } = await import(
  pathToFileURL(join(ROOT, "lib", "combat", "pa-turn-discount.ts")).href
);
const { startTurnPaFull } = await import(pathToFileURL(join(ROOT, "lib", "combat", "pa-turn.ts")).href);
const { paTurnRulesForActor } = await import(pathToFileURL(join(ROOT, "lib", "combat", "pa-economy.ts")).href);
const { weaponAttackCount } = await import(pathToFileURL(join(ROOT, "lib", "combat", "pa-cost-reduce.ts")).href);
const { classLevelFeatures } = await import(pathToFileURL(join(ROOT, "lib", "character", "rules.ts")).href);

// Acao de arma comum: 1d6 perfurante, sem bonus de atributo (todos os atributos 10).
const acao = {
  packId: "armas",
  entryId: "teste-d11",
  name: "Adaga de teste",
  kind: "weapon",
  resolution: "attack",
  damageFormula: "1d6",
  damageType: "perfurante",
  attackBonus: 0,
  rangeCells: 1,
  paCost: 1,
  label: "Adaga de teste",
};
const acaoMagia = { ...acao, packId: "magias", entryId: "magia-d11", name: "Magia de teste", kind: "spell", resolution: "save" };
const acaoHabilidade = { ...acao, packId: "habilidades", entryId: "hab-d11", name: "Habilidade de teste", kind: "ability" };

function ficha(classe, nivel) {
  return {
    name: "Heroi",
    identity: { classe, nivel },
    attributes: { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, carisma: 10 },
    proficiencies: [],
    resources: {},
  };
}

const atacanteBase = { id: "atq", name: "Heroi", axial: { q: 0, r: 0 }, vida: 30, vidaMax: 30, defesa: 10 };
const alvo = {
  id: "alvo",
  name: "Goblin",
  axial: { q: 1, r: 0 },
  vida: 500,
  vidaMax: 500,
  defesa: 1,
  monsterEntryId: "monstros-goblin",
};
const alvoDuro = { ...alvo, id: "alvo-duro", defesa: 30 };
const aliadoAdjacente = { id: "ali", name: "Aliado", axial: { q: 2, r: 0 }, vida: 20, vidaMax: 20, defesa: 10 };
const aliadoLonge = { id: "longe", name: "Aliado longe", axial: { q: 5, r: 0 }, vida: 20, vidaMax: 20, defesa: 10 };
const aliadoMorto = { id: "morto", name: "Aliado morto", axial: { q: 2, r: 0 }, vida: 0, vidaMax: 20, defesa: 10 };
const monstroAdjacente = {
  id: "mon",
  name: "Outro goblin",
  axial: { q: 2, r: 0 },
  vida: 20,
  vidaMax: 20,
  defesa: 10,
  monsterEntryId: "monstros-goblin",
};

const OPTS = { skipPaCheck: true, skipRangeCheck: true };
const VANTAGEM = { rollMode: "advantage" };
// Fases do motor (combat-pa-phase.ts): combate_turn tem fila; combat_free e exploration nao.
const TURNO = { combatActive: true, combatHasOrder: true, bypassTurn: true, combatRound: 1 };
const LIVRE = { combatActive: true, combatHasOrder: false, bypassTurn: true, combatRound: 1 };

// Um acerto sem critico: repete ate acertar (natural 1 erra sempre; alvo com CA 1 acerta quase sempre).
// Critico tem teste proprio (golpeCritico), para os dados contados aqui nao dobrarem.
function golpe(atacante, actor, allTokens, action = acao, modifier = undefined, defender = alvo, turn = undefined) {
  for (let i = 0; i < 500; i++) {
    const res = resolveAttack(atacante, defender, actor, action, turn, modifier, allTokens, OPTS);
    if (res.hit && res.damage && !res.critical) return res;
  }
  throw new Error("nao acertou em 500 tentativas");
}

// Um ataque que erra (alvo com CA alta; so critico acerta).
function golpeErrado(atacante, actor, allTokens, action = acao) {
  for (let i = 0; i < 500; i++) {
    const res = resolveAttack(atacante, alvoDuro, actor, action, undefined, undefined, allTokens, OPTS);
    if (!res.hit) return res;
  }
  throw new Error("nao errou em 500 tentativas");
}

// Um ataque que tira critico (natural 20).
function golpeCritico(actor, allTokens, modifier, turn = undefined) {
  for (let i = 0; i < 5000; i++) {
    const res = resolveAttack(atacanteBase, alvo, actor, acao, turn, modifier, allTokens, OPTS);
    if (res.critical && res.damage) return res;
  }
  throw new Error("nao teve critico em 5000 tentativas");
}

// Aplica o resultado no atacante, como o handler faz depois de cada ataque (attackerAfterAttack).
function aplicar(atacante, res, action = acao) {
  const patch = attackerAfterAttack(atacante, action, false, false, res.hit, res.sneakAttackUsed);
  return { ...atacante, ...patch };
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

// Dados: quantidade por nivel (1d6 no 1, 3d6 no 5, 5d6 no 10, 10d6 no 20).
caso("sneakAttackDiceForLevel: 1->1, 5->3, 10->5, 20->10", () => {
  assert.equal(sneakAttackDiceForLevel(1), 1);
  assert.equal(sneakAttackDiceForLevel(5), 3);
  assert.equal(sneakAttackDiceForLevel(10), 5);
  assert.equal(sneakAttackDiceForLevel(20), 10);
});

caso("classLevelFeatures(Ladino, 1) traz Ataque Furtivo 1d6 e nao o nome antigo", () => {
  const txt = classLevelFeatures("Ladino", 1).join(" | ");
  assert.match(txt, /Ataque Furtivo — 1d6/);
  assert.doesNotMatch(txt, /Golpe Oportunista/);
});

caso("classLevelFeatures(Ladino, 20) traz Ataque Furtivo 10d6", () => {
  assert.match(classLevelFeatures("Ladino", 20).join(" | "), /Ataque Furtivo — 10d6/);
});

caso("formula: Ladino com Vantagem em ataque com arma recebe o dado; sem condicao nao", () => {
  const base = { classe: "Ladino", nivel: 5, actionKind: "weapon", attacker: atacanteBase, defender: alvo, allTokens: [atacanteBase, alvo] };
  assert.equal(sneakAttackFormula({ ...base, rollMode: "advantage" }), "3d6");
  assert.equal(sneakAttackFormula({ ...base, rollMode: "normal" }), undefined);
});

caso("formula: outra classe nunca recebe, mesmo com Vantagem e aliado", () => {
  assert.equal(
    sneakAttackFormula({
      classe: "Guerreiro", nivel: 10, rollMode: "advantage", actionKind: "weapon",
      attacker: atacanteBase, defender: alvo, allTokens: [atacanteBase, alvo, aliadoAdjacente],
    }),
    undefined
  );
});

caso("formula: aliado adjacente vivo ativa; aliado longe, morto ou monstro nao", () => {
  const base = { classe: "Ladino", nivel: 1, rollMode: "normal", actionKind: "weapon", attacker: atacanteBase, defender: alvo };
  assert.equal(sneakAttackFormula({ ...base, allTokens: [atacanteBase, alvo, aliadoAdjacente] }), "1d6");
  assert.equal(sneakAttackFormula({ ...base, allTokens: [atacanteBase, alvo, aliadoLonge] }), undefined);
  assert.equal(sneakAttackFormula({ ...base, allTokens: [atacanteBase, alvo, aliadoMorto] }), undefined);
  assert.equal(sneakAttackFormula({ ...base, allTokens: [atacanteBase, alvo, monstroAdjacente] }), undefined);
});

caso("formula: magia, habilidade e desarmado nunca recebem (so arma)", () => {
  for (const actionKind of ["spell", "ability", "unarmed"]) {
    assert.equal(
      sneakAttackFormula({
        classe: "Ladino", nivel: 10, rollMode: "advantage", actionKind,
        attacker: atacanteBase, defender: alvo, allTokens: [atacanteBase, alvo],
      }),
      undefined,
      actionKind
    );
  }
});

caso("formula: token com sneakAttackUsedThisTurn nao recebe de novo", () => {
  assert.equal(
    sneakAttackFormula({
      classe: "Ladino", nivel: 5, rollMode: "advantage", actionKind: "weapon",
      attacker: { ...atacanteBase, sneakAttackUsedThisTurn: true }, defender: alvo, allTokens: [atacanteBase, alvo],
      turnWindow: true,
    }),
    undefined
  );
});

caso("formula: fora da fase combat_turn a flag nao bloqueia (sem turno, sem limite)", () => {
  assert.equal(
    sneakAttackFormula({
      classe: "Ladino", nivel: 5, rollMode: "advantage", actionKind: "weapon",
      attacker: { ...atacanteBase, sneakAttackUsedThisTurn: true }, defender: alvo, allTokens: [atacanteBase, alvo],
      turnWindow: false,
    }),
    "3d6"
  );
});

caso("fase: sneakAttackTurnWindow so vale em combat_turn (fila de turnos)", () => {
  assert.equal(sneakAttackTurnWindow(TURNO), true);
  assert.equal(sneakAttackTurnWindow(LIVRE), false);
  assert.equal(sneakAttackTurnWindow({ combatActive: false, combatHasOrder: true }), false);
  assert.equal(sneakAttackTurnWindow(undefined), false);
});

caso("resolveAttack: Ladino nivel 1 sem condicao nao rola furtivo", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 1), [atacanteBase, alvo]);
  assert.equal(res.damage.sneakAttack, undefined);
  assert.equal(res.sneakAttackUsed, undefined);
  assert.equal(res.damage.total, res.damage.rolls.reduce((a, b) => a + b, 0));
});

caso("resolveAttack: Ladino nivel 1 com Vantagem rola 1d6 extra", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 1), [atacanteBase, alvo], acao, VANTAGEM);
  assert.equal(res.damage.sneakAttack.formula, "1d6");
  assert.equal(res.damage.sneakAttack.rolls.length, 1);
  assert.ok(res.damage.sneakAttack.rolls[0] >= 1 && res.damage.sneakAttack.rolls[0] <= 6);
  // Sem turno (exploracao): o furtivo sai, mas a flag nao e gravada.
  assert.equal(res.sneakAttackUsed, undefined);
});

caso("resolveAttack: Ladino nivel 1 com Vantagem em combat_turn grava a flag (determinístico: acerto sem critico)", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 1), [atacanteBase, alvo], acao, VANTAGEM, alvo, TURNO);
  assert.equal(res.damage.sneakAttack.rolls.length, 1);
  assert.equal(res.sneakAttackUsed, true);
});

caso("resolveAttack: Ladino nivel 5 com Vantagem rola 3d6 extra", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 5), [atacanteBase, alvo], acao, VANTAGEM);
  assert.equal(res.damage.sneakAttack.rolls.length, 3);
});

caso("resolveAttack: Ladino nivel 10 com Vantagem rola 5d6 extra", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 10), [atacanteBase, alvo], acao, VANTAGEM);
  assert.equal(res.damage.sneakAttack.rolls.length, 5);
});

caso("resolveAttack: Ladino nivel 10 sem Vantagem, com aliado adjacente, rola 5d6", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 10), [atacanteBase, alvo, aliadoAdjacente]);
  assert.equal(res.damage.sneakAttack.rolls.length, 5);
});

caso("resolveAttack: Vantagem e aliado juntos rolam o dado uma vez so", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 10), [atacanteBase, alvo, aliadoAdjacente], acao, VANTAGEM);
  assert.equal(res.damage.sneakAttack.rolls.length, 5);
});

caso("resolveAttack: Ladino nivel 20 com Vantagem rola 10d6 extra", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 20), [atacanteBase, alvo], acao, VANTAGEM);
  assert.equal(res.damage.sneakAttack.rolls.length, 10);
});

caso("resolveAttack: outra classe com Vantagem e aliado nao recebe furtivo", () => {
  const res = golpe(atacanteBase, ficha("Guerreiro", 10), [atacanteBase, alvo, aliadoAdjacente], acao, VANTAGEM);
  assert.equal(res.damage.sneakAttack, undefined);
});

caso("resolveAttack: Ladino com magia (kind spell) em Vantagem nao recebe furtivo", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 10), [atacanteBase, alvo], acaoMagia, VANTAGEM);
  assert.equal(res.damage.sneakAttack, undefined);
  assert.equal(res.sneakAttackUsed, undefined);
});

caso("resolveAttack: Ladino com habilidade (kind ability) em Vantagem nao recebe furtivo", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 10), [atacanteBase, alvo], acaoHabilidade, VANTAGEM);
  assert.equal(res.damage.sneakAttack, undefined);
});

caso("resolveAttack: dano total inclui o furtivo (base + furtivo)", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 5), [atacanteBase, alvo], acao, VANTAGEM);
  const base = res.damage.rolls.reduce((a, b) => a + b, 0);
  const sneak = res.damage.sneakAttack.rolls.reduce((a, b) => a + b, 0);
  assert.equal(res.damage.total, base + sneak);
});

caso("critico: Ladino nivel 5 com Vantagem rola o furtivo de novo (6 dados, formula x2)", () => {
  const res = golpeCritico(ficha("Ladino", 5), [atacanteBase, alvo], VANTAGEM);
  assert.equal(res.damage.sneakAttack.rolls.length, 6);
  assert.equal(res.damage.formula, "1d6+3d6");
  const base = res.damage.rolls.reduce((a, b) => a + b, 0);
  const sneak = res.damage.sneakAttack.rolls.reduce((a, b) => a + b, 0);
  assert.equal(res.damage.total, base + sneak);
});

caso("critico: outra classe nao recebe furtivo nem no critico", () => {
  const res = golpeCritico(ficha("Guerreiro", 5), [atacanteBase, alvo], VANTAGEM);
  assert.equal(res.damage.sneakAttack, undefined);
});

caso("turno: primeiro acerto com furtivo marca o turno; o segundo ataque do turno nao recebe", () => {
  const actor = ficha("Ladino", 5);
  const tokens = [atacanteBase, alvo];
  const r1 = golpe(atacanteBase, actor, tokens, acao, VANTAGEM, alvo, TURNO);
  assert.equal(r1.damage.sneakAttack.rolls.length, 3);
  const depois1 = aplicar(atacanteBase, r1);
  assert.equal(depois1.sneakAttackUsedThisTurn, true);
  const r2 = golpe(depois1, actor, tokens, acao, VANTAGEM, alvo, TURNO);
  assert.equal(r2.damage.sneakAttack, undefined);
  assert.equal(r2.sneakAttackUsed, undefined);
  assert.equal(aplicar(depois1, r2).sneakAttackUsedThisTurn, true);
});

caso("turno: ataque que erra nao gasta o furtivo; o proximo acerto recebe", () => {
  const actor = ficha("Ladino", 5);
  const erro = golpeErrado(atacanteBase, actor, [atacanteBase, alvoDuro], acao);
  assert.equal(erro.sneakAttackUsed, undefined);
  const depois = aplicar(atacanteBase, erro);
  assert.equal(depois.sneakAttackUsedThisTurn, undefined);
  const acerto = golpe(depois, actor, [depois, alvo], acao, VANTAGEM, alvo, TURNO);
  assert.equal(acerto.damage.sneakAttack.rolls.length, 3);
});

caso("turno seguinte: zerar o turno (clearPaDiscountUsed) faz o Ladino receber de novo", () => {
  const actor = ficha("Ladino", 5);
  const tokens = [atacanteBase, alvo];
  const r1 = golpe(atacanteBase, actor, tokens, acao, VANTAGEM, alvo, TURNO);
  const depois1 = aplicar(atacanteBase, r1);
  assert.equal(depois1.sneakAttackUsedThisTurn, true);
  const novoTurno = clearPaDiscountUsed(depois1);
  assert.equal(novoTurno.sneakAttackUsedThisTurn, undefined);
  const r3 = golpe(novoTurno, actor, tokens, acao, VANTAGEM, alvo, TURNO);
  assert.equal(r3.damage.sneakAttack.rolls.length, 3);
});

caso("ataque multiplo: resolveMultiAttack com dois acertos resolve os dois golpes; sem furtivo (so Ladino tem)", () => {
  // Ladino tem 1 ataque por acao (weaponAttackCount), entao o laco do limite so roda para
  // classes com ataque extra. Aqui o Guerreiro (2 ataques) prova que o laco roda com dois acertos.
  assert.equal(weaponAttackCount(ficha("Ladino", 20), acao), 1);
  assert.equal(weaponAttackCount(ficha("Guerreiro", 5), acao), 2);
  const atacanteG = { ...atacanteBase, pa: 10, bankedPa: 0 };
  let results = [];
  for (let i = 0; i < 500; i++) {
    results = resolveMultiAttack(atacanteG, alvo, ficha("Guerreiro", 5), acao, TURNO, [atacanteG, alvo]);
    if (results.length === 2 && results.every((r) => r.hit)) break;
  }
  assert.equal(results.length, 2);
  assert.ok(results.every((r) => r.hit), "dois acertos");
  assert.ok(results.every((r) => r.damage.sneakAttack === undefined));
  assert.ok(results.every((r) => r.sneakAttackUsed === undefined));
});

caso("inicio de turno (startTurnPaFull) zera a flag do furtivo", () => {
  const usado = { ...atacanteBase, sneakAttackUsedThisTurn: true };
  const turnoNovo = startTurnPaFull(usado, paTurnRulesForActor(ficha("Ladino", 5)));
  assert.equal(turnoNovo.sneakAttackUsedThisTurn, undefined);
});

caso("combate livre (combat_free, sem fila): o limite nao se aplica e a flag nao e gravada", () => {
  // Decisao do dono (D-19 resolvido): o limite de uma vez por turno so vale com fila de turnos.
  const actor = ficha("Ladino", 5);
  const tokens = [atacanteBase, alvo];
  const r1 = golpe(atacanteBase, actor, tokens, acao, VANTAGEM, alvo, LIVRE);
  assert.equal(r1.damage.sneakAttack.rolls.length, 3);
  assert.equal(r1.sneakAttackUsed, undefined);
  const depois1 = aplicar(atacanteBase, r1);
  assert.equal(depois1.sneakAttackUsedThisTurn, undefined);
  const r2 = golpe(depois1, actor, tokens, acao, VANTAGEM, alvo, LIVRE);
  assert.equal(r2.damage.sneakAttack.rolls.length, 3);
});

caso("exploracao (sem combate ativo): o limite nao se aplica e a flag nao e gravada", () => {
  const actor = ficha("Ladino", 5);
  const tokens = [atacanteBase, alvo];
  const r1 = golpe(atacanteBase, actor, tokens, acao, VANTAGEM);
  assert.equal(r1.damage.sneakAttack.rolls.length, 3);
  assert.equal(r1.sneakAttackUsed, undefined);
  const r2 = golpe(aplicar(atacanteBase, r1), actor, tokens, acao, VANTAGEM);
  assert.equal(r2.damage.sneakAttack.rolls.length, 3);
});

caso("critico no combate_turn: a flag e gravada mesmo com o dado dobrado", () => {
  const res = golpeCritico(ficha("Ladino", 5), [atacanteBase, alvo], VANTAGEM, TURNO);
  assert.equal(res.damage.sneakAttack.rolls.length, 6);
  assert.equal(res.sneakAttackUsed, true);
});

caso("texto: formatAttackChatDetail mostra +Furtivo no detalhe de dano", () => {
  const res = golpe(atacanteBase, ficha("Ladino", 5), [atacanteBase, alvo], acao, VANTAGEM);
  const texto = formatAttackChatDetail(res);
  assert.match(texto, /\+Furtivo \d+(\+\d+){2}/, texto);
});

console.log(`\nverify-d11-ataque-furtivo: ${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
