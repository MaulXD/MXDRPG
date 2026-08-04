/**
 * Verifica o motor de resolução do Um Anel (Dado de Proeza + Dados de Sucesso)
 * contra o capítulo 2 do livro — entra em `npm run test`.
 *
 * O achado que motivou o teste: `rollTorSkillCheck` e
 * `rollTorCombatProficiencyCheck` passavam `illFavoured: conditions.miserable`.
 * O livro trata Arrasado e Desfavorecido como condições SEPARADAS — Arrasado
 * só faz o Olho virar falha; Desfavorecido é que rola dois Dados de Proeza e
 * fica com o pior. Somar as duas era dupla penalidade em TODA rolagem de
 * Perícia de um herói Arrasado. Mesmo bug já corrigido antes no Teste de
 * Proteção (resolve-attack.ts) — sobreviveu neste outro sítio.
 *
 * Fonte: livros/um-anel/02-resolucao-de-acoes.md
 *
 * ATENÇÃO pra quem for traduzir outro capítulo: as asserções "livro:" casam com
 * o texto do markdown, e o markdown é PT-BR depois de traduzido. Traduzir um
 * capítulo QUEBRA os testes que citavam o inglês dele — é esperado, e o
 * conserto é reancorar no texto PT-BR na mesma rodada. Ainda há asserções em
 * inglês apontando pra 06-fases-de-aventura-combate.md e
 * 08-mestre-e-adversarios.md em verify-um-anel-stances.mjs; elas vão quebrar
 * quando esses dois forem traduzidos.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const BOOK = readFileSync(root("livros", "um-anel", "02-resolucao-de-acoes.md"), "utf8");
const DICE_RAW = readFileSync(root("lib", "character", "um-anel", "dice.ts"), "utf8");
const RULES_RAW = readFileSync(root("lib", "character", "um-anel", "rules.ts"), "utf8");

let pass = 0;
let fail = 0;

function ok(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Remove comentários trocando por espaços (preserva offsets e linhas). */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, " "));
}

const DICE = stripComments(DICE_RAW);
const RULES = stripComments(RULES_RAW);

/**
 * Trecho de uma função de módulo: da declaração até a `}` na coluna 0 que a
 * fecha. Escopar importa — sem isto, uma asserção negativa vaza pra função
 * seguinte (erro já cometido em verify-um-anel-shadow.mjs).
 *
 * Em TS a chave do corpo não é simplesmente "a primeira `{` depois do nome" —
 * antes dela vêm o tipo do parâmetro (`rollTorCheck(opts: { ... })`) e o tipo
 * de retorno (`): { outcome: X } {`), ambos com chaves. E não é "a primeira
 * `}` na coluna 0" tampouco: um tipo de parâmetro multilinha fecha justamente
 * assim (`}): TorRollOutcome {`). Então: pula a lista de parâmetros contando
 * parênteses, e depois pula anotações de tipo de retorno casando chaves até
 * sobrar a que abre o corpo.
 */
function fnBody(src, name) {
  const decl = src.search(new RegExp(`(function|const)\\s+${name}\\b`));
  if (decl < 0) return "";

  // 1. Fim da lista de parâmetros (parênteses casados).
  const paren = src.indexOf("(", decl);
  if (paren < 0) return "";
  let pd = 0;
  let afterParams = -1;
  for (let i = paren; i < src.length; i++) {
    if (src[i] === "(") pd++;
    else if (src[i] === ")") {
      pd--;
      if (pd === 0) {
        afterParams = i + 1;
        break;
      }
    }
  }
  if (afterParams < 0) return "";

  /** Índice da `}` que casa com a `{` em `open`. */
  const matchBrace = (open) => {
    let bd = 0;
    for (let i = open; i < src.length; i++) {
      if (src[i] === "{") bd++;
      else if (src[i] === "}") {
        bd--;
        if (bd === 0) return i;
      }
    }
    return -1;
  };

  // 2. Candidata a chave do corpo. Se, depois dela casar, vier outra `{`,
  //    a candidata era anotação de tipo de retorno — a próxima é o corpo.
  let open = src.indexOf("{", afterParams);
  for (let guard = 0; guard < 4 && open >= 0; guard++) {
    const close = matchBrace(open);
    if (close < 0) break;
    const next = src.slice(close + 1).search(/\S/);
    if (next >= 0 && src[close + 1 + next] === "{") {
      open = close + 1 + next;
      continue;
    }
    return src.slice(open, close + 1);
  }
  return "";
}

console.log("verify-um-anel-dice: motor de resolução × capítulo 2");

/* ── 1. Leitura dos dados ───────────────────────────────────────────────── */

ok(
  "livro: Runa de Gandalf é sucesso automático",
  /runa de Gandalf[\s\S]{0,120}?a ação tem sucesso independentemente/i.test(BOOK)
);
ok(
  "livro: Olho de Sauron conta como zero",
  /Olho de Sauron[,\s\S]{0,80}?resultado do Dado de Proeza conta como zero/i.test(BOOK)
);
ok("código: Olho → numeric 0", /kind: "eye", numeric: 0/.test(DICE));
ok("código: Runa → numeric 10", /kind: "gandalf", numeric: 10/.test(DICE));

// A face física (11/12) é só visual — o valor de jogo já é o numeric.
ok(
  "código: face física separa Olho (11) da Runa (12)",
  /"eye"\) return 11;/.test(DICE) && /"gandalf"\) return 12;/.test(DICE)
);

// Ordem de força pra escolher entre dois dados: Olho é o pior, Runa o melhor.
const RANK = fnBody(DICE, "featDieRank");
ok("featDieRank: Olho é o pior (-1)", /"eye"\) return -1;/.test(RANK));
ok("featDieRank: Runa é a melhor (11)", /"gandalf"\) return 11;/.test(RANK));

/* ── 2. Favorecida / Desfavorecida e o cancelamento ─────────────────────── */

ok(
  "livro: Favorecida rola 2 Dados de Proeza e fica com o melhor",
  /rolagem Favorecida[\s\S]{0,120}?dois Dados de Proeza[\s\S]{0,60}?ficando com o \*\*melhor\*\*/i.test(BOOK)
);
ok(
  "livro: Desfavorecida fica com o pior",
  /rolagem Desfavorecida[\s\S]{0,120}?dois Dados de Proeza[\s\S]{0,60}?ficando com o \*\*pior\*\*/i.test(BOOK)
);
// A regra que implementações ingênuas erram: as duas NÃO se somam nem se
// compensam por contagem — qualquer conflito resolve normal, com 1 dado.
ok(
  "livro: Favorecida + Desfavorecida resolvem NORMAL (1 dado)",
  /Favorecida \*\*e\*\* Desfavorecida[\s\S]{0,140}?rolagem é resolvida normalmente \(rola-se apenas um Dado de Proeza\)/i.test(BOOK)
);
ok(
  "livro: cancelamento não depende da contagem de fontes",
  /mesmo que múltiplas fontes a tornem Favorecida e apenas uma a torne Desfavorecida/i.test(BOOK)
);

const ROLL = fnBody(DICE, "rollTorCheck");
ok(
  "código: Favorecida é anulada por Desfavorecida",
  /const favoured = Boolean\(opts\.favoured\) && !opts\.illFavoured;/.test(ROLL)
);
ok(
  "código: Desfavorecida é anulada por Favorecida",
  /const illFavoured = Boolean\(opts\.illFavoured\) && !opts\.favoured;/.test(ROLL)
);
ok(
  "código: rola 2 dados só se Favorecida ou Desfavorecida",
  /rollCount = favoured \|\| illFavoured \? 2 : 1/.test(ROLL)
);
ok(
  "código: Desfavorecida escolhe o menor rank, senão o maior",
  /featDieRank\(b\) < featDieRank\(a\)/.test(ROLL) && /featDieRank\(b\) > featDieRank\(a\)/.test(ROLL)
);

/* ── 3. As condições ────────────────────────────────────────────────────── */

// Arrasado: Sombra ≥ Esperança ATUAL, e o efeito é SÓ o Olho virar falha.
ok(
  "livro: Arrasado é Sombra ≥ Esperança atual",
  /pontuação de Sombra \*\*iguala ou excede sua Esperança atual\*\*, eles ficam Arrasados/i.test(BOOK)
);
ok(
  "livro: efeito de Arrasado é o Olho virar falha",
  /herói Arrasado faz uma rolagem[\s\S]{0,140}?Olho de Sauron, \*\*a ação falha\*\*/i.test(
    BOOK
  )
);
// Desfavorecido: Sombra ≥ Esperança MÁXIMA. Condição diferente, efeito diferente.
ok(
  "livro: Desfavorecido é Sombra ≥ Esperança máxima",
  /pontuação de Sombra iguala sua \*\*Esperança máxima\*\* são considerados Desfavorecidos em todas as rolagens/i.test(BOOK)
);

ok("código: falha automática exige Arrasado E Olho", /Boolean\(opts\.miserable\) && featDie\.kind === "eye"/.test(ROLL));
ok("código: sucesso automático na Runa", /autoSuccess = featDie\.kind === "gandalf"/.test(ROLL));

/* A REGRESSÃO. Escopada ao corpo de cada função e com fronteira nas duas
   pontas — `conditions.miserable` sozinho é legítimo (alimenta `miserable`). */
const SKILL_FN = fnBody(DICE, "rollTorSkillCheck");
const PROF_FN = fnBody(DICE, "rollTorCombatProficiencyCheck");
ok("rollTorSkillCheck existe", SKILL_FN.length > 50);
ok("rollTorCombatProficiencyCheck existe", PROF_FN.length > 50);
for (const [label, body] of [
  ["rolagem de Perícia", SKILL_FN],
  ["rolagem de Proficiência", PROF_FN],
]) {
  ok(
    `${label}: NÃO desfavorece por estar Arrasado`,
    !/illFavoured:\s*character\.conditions\.miserable\b/.test(body)
  );
  ok(
    `${label}: Desfavorecido vem do helper de Sombra`,
    /illFavoured: torSheetIllFavoured\(character\)/.test(body)
  );
  // Arrasado continua alimentando a falha automática — a correção não pode
  // ter simplesmente removido a condição.
  ok(
    `${label}: Arrasado ainda alimenta a falha automática`,
    /miserable: character\.conditions\.miserable/.test(body)
  );
}

const HELPER = fnBody(DICE, "torSheetIllFavoured");
ok(
  "torSheetIllFavoured usa a Esperança MÁXIMA",
  /hopeMax: character\.hope\.max/.test(HELPER) && !/hope\.value/.test(HELPER)
);
ok(
  "helper em rules.ts soma Cicatrizes à Sombra",
  /params\.shadow \+ params\.shadowScars >= params\.hopeMax/.test(
    fnBody(RULES, "isTorIllFavouredByShadow")
  )
);

// Exausto: zera Dados de Sucesso de 1 a 3.
ok(
  "livro: Exausto zera Dados de Sucesso 1–3",
  /herói Exausto faz uma rolagem[\s\S]{0,140}?contorno vazado \(\*\*1, 2 ou 3\*\*\) são considerados como tendo dado resultado \*\*zero\*\*/i.test(
    BOOK
  )
);
ok("código: Exausto zera value <= 3", /zeroedByWeary = Boolean\(opts\.weary\) && value <= 3/.test(ROLL));
ok(
  "código: dado zerado não entra na soma",
  /d\.zeroedByWeary \? 0 : d\.value/.test(ROLL)
);

/* ── 4. Grau de sucesso ─────────────────────────────────────────────────── */

ok(
  "livro: 1 ícone = grande sucesso",
  /Um ícone de Sucesso\*\*[\s\S]{0,140}?\*\*um grande sucesso\*\*/i.test(BOOK)
);
ok(
  "livro: 2+ ícones = sucesso extraordinário",
  /Dois ou mais ícones de Sucesso\*\*[\s\S]{0,160}?\*\*um sucesso extraordinário\*\*/i.test(BOOK)
);
ok("código: ícone de sucesso é o 6", /icon: value === 6/.test(ROLL));
ok(
  "código: 2+ ícones → extraordinário, 1 → grande",
  /successIcons >= 2[\s\S]{0,80}?"extraordinary"[\s\S]{0,80}?successIcons === 1[\s\S]{0,60}?"great"/.test(ROLL)
);
// Grau só existe em sucesso — um Arrasado que falha no Olho não pode sair
// "extraordinário" só porque rolou dois 6 nos Dados de Sucesso.
ok("código: falha não tem grau", /!success\s*\?\s*"failure"/.test(ROLL));

/* ── 5. Rank e penalidades ──────────────────────────────────────────────── */

ok(
  "livro: penalidade desce até no mínimo zero Dados de Sucesso",
  /\*\*até um mínimo de zero\*\* Dados de Sucesso/i.test(BOOK)
);
ok("código: rank negativo é clampado em 0", /Math\.max\(0, opts\.rank\)/.test(ROLL));

// Regras de Esperança que o motor ainda NÃO implementa (rank chega pronto de
// fora). Ficam asseridas no livro pra não se perderem quando forem ligadas.
ok(
  "livro: 1 Esperança dá (1d), e não se gasta várias",
  /gastar 1 ponto de Esperança para \*ganhar \(1d\)\*/i.test(BOOK) &&
    /Não é possível gastar múltiplos pontos de Esperança para ganhar múltiplos Dados de Sucesso bônus/i.test(BOOK)
);
ok(
  "livro: Inspirado dobra o bônus de Esperança pra (2d)",
  /herói-jogador Inspirado que gasta 1 ponto de Esperança[\s\S]{0,80}?\*ganha \(2d\)\*/i.test(BOOK)
);
ok(
  "livro: só um herói pode apoiar gastando Esperança",
  /Apenas um herói-jogador pode gastar Esperança para apoiar o herói-jogador ativo/i.test(BOOK)
);

/* ── 6. Ataques de Briga ─────────────────────────────────────────────────
   Achado na rodada 6: o handler fixava rank 0 pra qualquer arma de briga
   (Desarmado, Adaga, Cacete, Porrete), ou seja, só o Dado de Proeza. O livro
   manda rolar a Proficiência de Combate MAIS ALTA do herói perdendo (1d).
   Com rank 0 o total máximo é 10, abaixo de qualquer NA de FORÇA típico
   (18 + Bloqueio) — a chance de acerto ia a zero fora da Runa de Gandalf. */

const BRIGA = readFileSync(
  root("livros", "um-anel", "09-starter-set-regras-condensadas.md"),
  "utf8"
);
const HANDLER_RAW = readFileSync(root("lib", "room", "handlers", "tor-combat-attack.ts"), "utf8");
const HANDLER = stripComments(HANDLER_RAW);
const DATA = stripComments(readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8"));

ok(
  "livro: briga rola a Proficiência mais alta perdendo (1d)",
  /role dados iguais à sua Proficiência de Combate mais alta, mas \*perca \(1d\)\*/i.test(BRIGA)
);
ok(
  "livro: desarmado tem Dano 1 e não perfura",
  /Ataques desarmados têm Dano 1 e não podem causar um Golpe Perfurante/i.test(BRIGA)
);

const BRAWL = fnBody(RULES, "torBrawlingRank");
ok("torBrawlingRank existe", BRAWL.length > 40);
ok("torBrawlingRank pega o MAIOR valor", /Math\.max\(\.\.\.values\)/.test(BRAWL));
ok("torBrawlingRank desconta o (1d)", /highest - 1/.test(BRAWL));
ok("torBrawlingRank clampa em 0", /Math\.max\(0, highest - 1\)/.test(BRAWL));

// A REGRESSÃO, escopada ao código sem comentários.
ok(
  "handler NÃO zera o rank de briga",
  !/proficiency === "brawling"\s*\?\s*0\b/.test(HANDLER)
);
ok(
  "handler usa torBrawlingRank pra briga",
  /proficiency === "brawling"[\s\S]{0,80}?torBrawlingRank\(sheet\.combatProficiencies\)/.test(HANDLER)
);
// Arma normal continua usando a Proficiência dela, não a mais alta.
ok(
  "arma normal usa a própria Proficiência",
  /sheet\.combatProficiencies\[weapon\.proficiency\] \?\? 0/.test(HANDLER)
);

// As 4 armas de briga do livro. Se alguém marcar uma espada como "brawling",
// ela passaria a rolar a Proficiência mais alta — isto acusa.
const brawlWeapons = [...DATA.matchAll(/id: "([a-z-]+)"[^}]*?proficiency: "brawling"/g)].map(
  (m) => m[1]
);
ok(
  "exatamente 4 armas de briga (desarmado, adaga, cacete, porrete)",
  brawlWeapons.length === 4 &&
    ["desarmado", "adaga", "cacete", "porrete"].every((w) => brawlWeapons.includes(w)),
  brawlWeapons.join(", ")
);
// Só Desarmado não perfura — Adaga (14), Cacete (12) e Porrete (14) perfuram.
ok(
  "só Desarmado tem injury null",
  /id: "desarmado"[^}]*?injury: null/.test(DATA) &&
    (DATA.match(/injury: null/g) || []).length === 1
);

console.log(`\nverify-um-anel-dice: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
