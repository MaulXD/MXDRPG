/**
 * Dano Especial — gasto de ícones de Sucesso.
 *
 * Por que existe: `TorAdversaryAction.specialDamage` era `string[]` decorativo e
 * o herói não tinha como gastar ícone nenhum. E a Virtude **Mão Firme**, que
 * existe em `STARTING_VIRTUES` desde sempre, não fazia absolutamente nada.
 *
 * O ponto mais fácil de errar aqui são DUAS listas diferentes que dividem dois
 * nomes:
 *
 * - herói (cap. 6): Golpe Pesado, Aparar, Perfurar, Investida de Escudo;
 * - adversário (cap. 8): Quebrar Escudo, Golpe Pesado, Perfurar, Agarrar.
 *
 * E dois nomes parecidos que são coisas distintas: **Perfurar** (Dano Especial,
 * soma no Dado de Proeza) × **Golpe Perfurante** (resultado 10/Runa que obriga o
 * Teste de Proteção).
 *
 * Fonte: 06-fases-de-aventura-combate.md e 08-mestre-e-adversarios.md
 */
import { readFileSync as rawReadFileSync } from "fs";

/* Normaliza CRLF -> LF na leitura: âncoras de linha não devem depender de fim
   de linha (no Windows um clone novo entrega CRLF). */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const CAP5 = readFileSync(root("livros", "um-anel", "05-valor-e-sabedoria.md"), "utf8");
const CAP6 = readFileSync(root("livros", "um-anel", "06-fases-de-aventura-combate.md"), "utf8");
const CAP8 = readFileSync(root("livros", "um-anel", "08-mestre-e-adversarios.md"), "utf8");
const SD = readFileSync(root("lib", "combat", "um-anel", "special-damage.ts"), "utf8");
const RESOLVE = readFileSync(root("lib", "combat", "um-anel", "resolve-attack.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-combat-attack.ts"), "utf8");
const ADV = readFileSync(root("lib", "character", "um-anel", "adversaries.ts"), "utf8");
const DATA = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");
const ROUTE = readFileSync(
  root("app", "api", "room", "[roomId]", "combat", "attack", "route.ts"),
  "utf8"
);
const POPUP = readFileSync(root("components", "vtt", "TorAttackPopup.tsx"), "utf8");

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

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

console.log("verify-um-anel-dano-especial: gasto de ícones × livro");

/* ── 1. As duas listas são diferentes e estão no livro ─────────────────── */

for (const nome of ["GOLPE PESADO", "APARAR", "PERFURAR", "INVESTIDA DE ESCUDO"]) {
  ok(`capítulo 6 lista "${nome}" (opções do herói)`, CAP6.includes(`**${nome} —`));
}
for (const nome of ["QUEBRAR ESCUDO", "GOLPE PESADO", "PERFURAR", "AGARRAR"]) {
  ok(`capítulo 8 lista "${nome}" (opções do adversário)`, CAP8.includes(`**${nome}:**`));
}

/* Toda opção listada num bloco do bestiário tem de ser uma das quatro do
   capítulo 8 — nome fora da lista mandaria o Mestre procurar regra que não
   existe. "Sobrepujar" é exceção conhecida e anotada: o livro cita e nunca
   define (ver 12-o-mundo-eriador.md). */
const OPCOES_ADVERSARIO = ["Quebrar Escudo", "Golpe Pesado", "Perfurar", "Agarrar", "Sobrepujar"];
const usadas = new Set(
  [...ADV.matchAll(/specialDamage: \[([^\]]*)\]/g)].flatMap((m) =>
    [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
  )
);
ok("bestiário usa opções de Dano Especial", usadas.size >= 3, `achou ${usadas.size}`);
for (const nome of usadas) {
  ok(`"${nome}" é opção válida de adversário`, OPCOES_ADVERSARIO.includes(nome));
}
/* Golpe Pesado NÃO aparece nos blocos, e é correto: "todos os adversários podem
   sempre escolher acionar um resultado de Golpe Pesado" — o bloco lista só os
   extras. Por isso o handler não pode condicioná-lo a `action.specialDamage`. */
ok(
  "livro: Golpe Pesado está sempre disponível ao adversário",
  /Todos os adversários podem sempre escolher acionar um resultado de dano especial de Golpe Pesado/.test(
    CAP8
  )
);
ok("Golpe Pesado não é listado nos blocos", !usadas.has("Golpe Pesado"));
const handlerCode = stripComments(HANDLER);
ok(
  "Golpe Pesado do adversário não depende do bloco",
  /heavyBlowValue = atkCombat\.attributeLevel \?\? 0;/.test(handlerCode),
  "condicionar a action.specialDamage tiraria uma opção que é sempre disponível"
);
ok(
  "Perfurar do adversário DEPENDE do bloco listar",
  /action\.specialDamage\?\.includes\("Perfurar"\)/.test(handlerCode)
);

/* ── 2. Números do livro ───────────────────────────────────────────────── */

ok(
  "livro: Golpe Pesado do herói = FORÇA, +1 com arma de 2 mãos",
  /perda adicional de Resistência igual ao seu\s*\n?\s*índice de \*\*FORÇA\*\*.*\n?.*\*\*\+1\*\* se estiver usando uma arma\s*\n?\s*de 2 mãos/s.test(
    CAP6
  )
);
ok(
  "livro: Perfurar é +1 Espadas, +2 Arcos, +3 Lanças",
  /\*\*\+1\*\* se estiver usando Espadas, \*\*\+2\*\* se estiver usando Arcos, \*\*\+3\*\* se\s*\n?\s*estiver usando Lanças/.test(
    CAP6
  )
);
ok("código: Espadas +1", /espadas: 1,/.test(SD));
ok("código: Arcos +2", /arcos: 2,/.test(SD));
ok("código: Lanças +3", /lancas: 3,/.test(SD));
/* Escopado à tabela de Perfurar: `machados` existe na tabela de APARAR (+1), que
   é outra coisa. Sem escopar, a asserção passaria a acusar a tabela errada. */
const tabelaPierce = SD.match(/PIERCE_BY_PROFICIENCY[\s\S]*?\};/)?.[0] ?? "";
ok(
  "Machados e Briga não perfuram",
  /if \(proficiency === "brawling"\) return 0;/.test(SD) && !/machados:/.test(tabelaPierce),
  "o livro nomeia só Arcos, Lanças e Espadas"
);
ok("livro: Perfurar do adversário é +2", /modificando o resultado do Dado de Proeza da rolagem de ataque em \+2/.test(CAP8));
ok("código: adversário +2 fixo", /ADVERSARY_PIERCE_BONUS = 2/.test(SD));
ok(
  "livro: Golpe Pesado do adversário = Nível de Atributo",
  /perda adicional de Resistência igual ao Nível de Atributo do atacante/.test(CAP8)
);

/* ── 3. Ordem de aplicação ─────────────────────────────────────────────── */

const resolveCode = stripComments(RESOLVE);
ok(
  "Dano Especial é resolvido ANTES do Golpe Perfurante",
  resolveCode.indexOf("resolveTorSpecialDamage(") < resolveCode.indexOf("const piercingBlow"),
  "calcular depois tornaria Perfurar inútil justamente onde ele mais importa"
);
const sdCode = stripComments(SD);
ok(
  "Perfurar é atendido antes do Golpe Pesado",
  sdCode.indexOf("const pierceUses") < sdCode.indexOf("const heavyBlowUses"),
  "Perfurar decide o Golpe Perfurante; não pode ficar sem ícone"
);
/* Escapar vem antes de tudo: estar Agarrado tranca o herói em Briga e postura
   Avançada, e é a única opção que o devolve ao jogo. */
ok(
  "Escapar do Agarrão é atendido primeiro",
  sdCode.indexOf("const escapeUses") < sdCode.indexOf("const pierceUses")
);
/* E o que muda o estado ALÉM da rodada vem antes do que vale só a rodada. */
ok(
  "Agarrar e Quebrar Escudo vêm antes de Aparar",
  sdCode.indexOf("const seizeUses") < sdCode.indexOf("const parryUses") &&
    sdCode.indexOf("const breakShieldUses") < sdCode.indexOf("const parryUses")
);
ok(
  "Olho e Runa não recebem o bônus de Perfurar",
  /attackRoll\.featDie\.kind === "number"/.test(resolveCode),
  "o livro exclui os dois ícones especiais do modificador"
);
ok(
  "livro confirma a exclusão de Olho e Runa",
  /os resultados \[Eye\] e \[Rune\] não são afetados por esse modificador/.test(CAP6)
);
ok(
  "opção indisponível não consome ícone",
  /if \(!disponivel\) return 0;/.test(sdCode),
  "gastar ícone em nada seria pior que não oferecer"
);
ok(
  "Perfurar só consome se a arma perfura",
  /gastar\(querer\(params\.plan\?\.pierce\), \(params\.pierceValue \?\? 0\) > 0\)/.test(sdCode)
);

/* ── 4. Mão Firme finalmente faz alguma coisa ──────────────────────────── */

ok("capítulo 5 tem MÃO FIRME", CAP5.includes("**MÃO FIRME**"));
ok(
  "livro: Mão Firme soma +1 na FORÇA do Golpe Pesado",
  /some \+1 ao seu valor de FORÇA em um Golpe Pesado/.test(CAP5)
);
/* A frase do livro diz "em um Golpe Perfurante", mas Golpe Perfurante não é uma
   opção de Dano Especial — e depois de disparado o valor do Dado de Proeza não é
   mais consultado, o que tornaria o +1 inerte. A nota de leitura no capítulo
   registra a interpretação; o teste exige que ela continue lá. */
ok(
  "capítulo 5 explica por que o +1 vale ao Perfurar",
  /Nota de leitura \(implementação\)/.test(CAP5) &&
    /o Dano\s*\n?>?\s*Especial que soma no Dado de Proeza é \*\*Perfurar\*\*/.test(CAP5)
);
ok(
  "data.ts descreve Mão Firme sem virar no-op",
  /ao Perfurar \(o que pode levar um 9 a 10/.test(DATA)
);
ok("Mão Firme entra no cálculo", /steadyHand \? 1 : 0/.test(SD));
ok(
  "handler lê Mão Firme da ficha",
  /attackerSteadyHand = sheet\.virtues\.includes\("mao-firme"\)/.test(handlerCode)
);

/* ── 5. Caminho até a mesa ─────────────────────────────────────────────── */

ok("handler passa o plano ao motor", /specialDamagePlan: opts\.specialDamage/.test(handlerCode));
ok(
  "rota recorta o plano recebido",
  /function sanitizeSpecialDamage/.test(ROUTE),
  "corpo da requisição não é confiável"
);
ok("rota limita o gasto declarado", /Math\.min\(6, Math\.max\(0, Math\.floor\(v\)\)\)/.test(ROUTE));
ok("popup oferece os dois gastos", /Dano Especial \(ícones de Sucesso\)/.test(POPUP));
ok(
  "popup desabilita Perfurar em arma que não perfura",
  /disabled=\{busy \|\| pierceBonus === 0\}/.test(POPUP)
);
ok("mensagem nomeia o gasto", /Dano Especial: \$\{usos\.join/.test(RESOLVE));

/* ── 6. As quatro opções que dependiam de estado ───────────────────────── */

/* Ficavam de fora por não haver onde guardar. Com `round-effects.ts` e os campos
   `grappled`/`shieldBroken`/`shieldParryBonus` no token, entraram. Cada uma com
   a condição que o livro exige — é aí que o erro mora. */

ok(
  "livro: Aparar é +1 Machados/Briga, +2 Espadas, +3 Lanças",
  /\*\*\+1\*\* usando Machados e todas as armas de Briga, \*\*\+2\*\* usando\s*\n?\s*Espadas, \*\*\+3\*\* usando Lanças/.test(
    CAP6
  )
);
const tabelaParry = SD.match(/PARRY_BY_PROFICIENCY[\s\S]*?\};/)?.[0] ?? "";
ok("Aparar: Machados +1", /machados: 1,/.test(tabelaParry));
ok("Aparar: Briga +1", /brawling: 1,/.test(tabelaParry));
ok("Aparar: Espadas +2", /espadas: 2,/.test(tabelaParry));
ok("Aparar: Lanças +3", /lancas: 3,/.test(tabelaParry));
ok(
  "Aparar não vale com Arco",
  /arcos: 0,/.test(tabelaParry) && /weapon\.ranged \? 0 : heroParryBonus/.test(handlerCode),
  "o livro diz 'qualquer arma de combate corpo a corpo'"
);
ok(
  "Aparar soma ao Bloqueio pela rodada, não ao ataque",
  /kind: "bloqueio"/.test(handlerCode) && /defCombat\.parry \+\s*\n?\s*\(bloqueio\?\.dice \?\? 0\)/.test(handlerCode)
);

ok(
  "livro: Investida de Escudo exige FORÇA maior que o Nível de Atributo do alvo",
  /Se sua \*\*FORÇA\*\* for maior que o Nível de Atributo do alvo/.test(CAP6)
);
ok(
  "Investida de Escudo confere escudo e FORÇA",
  /Boolean\(sheet\.armour\.shieldId\) &&\s*\n?\s*sheet\.attributes\.forca > \(defCombat\.attributeLevel \?\? 0\)/.test(
    handlerCode
  ),
  "sem a comparação o empurrão sairia de graça"
);

ok(
  "livro: escudo com Recompensa não pode ser quebrado",
  /um escudo aprimorado por Recompensas ou qualidades mágicas não pode ser quebrado/.test(CAP8)
);
ok(
  "Quebrar Escudo respeita a imunidade da Recompensa",
  /defenderShieldIsRewarded = defSheet\.rewards\.includes\("reforcado"\)/.test(handlerCode) &&
    /!defenderShieldIsRewarded/.test(handlerCode)
);
ok(
  "Quebrar Escudo não é efeito de rodada",
  /shieldBroken\?: boolean/.test(readFileSync(root("lib", "vtt", "types.ts"), "utf8")),
  "o livro não dá prazo — dura até consertar"
);
ok(
  "o Bloqueio perdido é exatamente o do escudo",
  /defCombat\.shieldBroken \? \(defCombat\.shieldParryBonus \?\? 0\) : 0/.test(handlerCode),
  "sem guardar a parcela do escudo não há como subtrair do Bloqueio já somado"
);

ok(
  "livro: agarrado só luta em Avançada com ataques de Briga",
  /a vítima só pode lutar em postura Avançada fazendo ataques de Briga/.test(CAP8)
);
/* Ancorado no `if (` de propósito: sem isso, um `false &&` na frente da condição
   desligaria a regra e a asserção continuaria passando — a expressão seguiria
   no arquivo, só que morta. */
ok(
  "handler barra o agarrado que tenta usar outra arma",
  /if \(atkCombat\.grappled && weapon\.proficiency !== "brawling"\)/.test(handlerCode),
  "a restrição vale ANTES de rolar"
);
ok(
  "livro: escapa gastando 1 ícone de ataque bem-sucedido",
  /Heróis agarrados podem libertar-se gastando um ícone .{0,20} de uma rolagem de ataque bem-sucedida/.test(
    CAP8
  )
);
ok("escapar limpa o Agarrado", /sd\.escapeUses > 0 \? \{ grappled: false \}/.test(handlerCode));

/* Agarrar e Quebrar Escudo SÓ existem se o bloco listar — ao contrário do Golpe
   Pesado, que é sempre disponível. */
ok(
  "Agarrar depende do bloco listar",
  /attackerSpecialOptions\.includes\("Agarrar"\)/.test(handlerCode)
);
ok(
  "Quebrar Escudo depende do bloco listar",
  /attackerSpecialOptions\.includes\("Quebrar Escudo"\)/.test(handlerCode)
);

/* A UI não pode oferecer o que não cabe. */
ok(
  "popup esconde Quebrar Escudo contra quem não tem escudo",
  /\(alvo\.shieldParryBonus \?\? 0\) > 0 &&\s*\n?\s*!alvo\.shieldBroken/.test(POPUP)
);
ok("popup só oferece Escapar a quem está agarrado", /combat\?\.grappled\) ops\.push/.test(POPUP));
ok(
  "opções de 1 ícone desmarcam depois do ataque",
  /setExtras\(\{\}\)/.test(POPUP),
  "deixar marcadas gastaria de novo no ataque seguinte"
);
ok("status do token mostra Agarrado", /Agarrado/.test(readFileSync(root("components", "vtt", "TokenStatusBody.tsx"), "utf8")));

console.log(`\n  ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
