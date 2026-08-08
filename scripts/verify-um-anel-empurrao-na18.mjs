/**
 * Empurrão e a variante de NA 18.
 *
 * Duas regras que ficaram por último porque nenhuma cabe no fluxo normal:
 *
 * - **Empurrão** é decisão de quem LEVOU o golpe, mas o ataque é uma requisição
 *   só, mandada por quem atacou. Sem uma oferta gravada no token, o defensor não
 *   teria sobre o que decidir;
 * - **NA 18** é opção de mesa, não da ficha — o mesmo herói pode jogar uma
 *   one-shot e uma campanha longa.
 *
 * Fontes: 06-fases-de-aventura-combate.md §Empurrão e
 * 02-resolucao-de-acoes.md §Ajustando os Números-Alvo.
 */
import { readFileSync as rawReadFileSync, existsSync } from "fs";

/* Normaliza CRLF -> LF na leitura: âncoras de linha não devem depender de fim
   de linha (no Windows um clone novo entrega CRLF). */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const CAP2 = readFileSync(root("livros", "um-anel", "02-resolucao-de-acoes.md"), "utf8");
const CAP6 = readFileSync(root("livros", "um-anel", "06-fases-de-aventura-combate.md"), "utf8");
const PUSH = readFileSync(root("lib", "combat", "um-anel", "push.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-push.ts"), "utf8");
const ATTACK = readFileSync(root("lib", "room", "handlers", "tor-combat-attack.ts"), "utf8");
const TASK = readFileSync(root("lib", "room", "handlers", "tor-combat-task.ts"), "utf8");
const RULES = readFileSync(root("lib", "character", "um-anel", "rules.ts"), "utf8");
const RESOLVE = readFileSync(root("lib", "combat", "um-anel", "resolve-attack.ts"), "utf8");
const SESSION = readFileSync(root("lib", "combat", "um-anel", "session-state.ts"), "utf8");
const TYPES = readFileSync(root("lib", "vtt", "types.ts"), "utf8");
const POPUP = readFileSync(root("components", "vtt", "TorAttackPopup.tsx"), "utf8");
const FELLOW = readFileSync(root("components", "vtt", "TorFellowshipPanel.tsx"), "utf8");
const PUSH_ROUTE = root("app", "api", "room", "[roomId]", "tor-push", "route.ts");

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

console.log("verify-um-anel-empurrao-na18: Empurrão e a variante de NA 18");

/* ── 1. Empurrão: o que o livro diz ────────────────────────────────────── */

ok(
  "livro: uma vez por rodada, metade da perda, arredondando para cima",
  /Uma vez por rodada, heróis-jogadores podem \*\*reduzir à metade a perda de Resistência\*\*[\s\S]{0,120}?\(arredondando frações para cima\)/.test(
    CAP6
  )
);
ok(
  "livro: custa a próxima ação principal",
  /eles gastarão sua próxima ação principal recuperando sua posição de combate/.test(CAP6)
);
ok("livro: adversários não podem", /Adversários não podem escolher ser empurrados\./.test(CAP6));

/* ── 2. O arredondamento é da perda que FICA ───────────────────────────── */

/* Perder 7 e "reduzir à metade arredondando para cima" deixa 4 de perda e
   devolve 3. Arredondar o que é devolvido daria 4 — meio ponto de vantagem em
   toda perda ímpar, sempre a favor do herói. */
const pushCode = stripComments(PUSH);
ok(
  "a metade arredondada é a perda restante",
  /const reduzida = Math\.ceil\(perda \/ 2\);/.test(pushCode) && /return perda - reduzida;/.test(pushCode),
  "arredondar o valor devolvido daria meio ponto a mais em toda perda ímpar"
);

/* Confere a aritmética de verdade, não só o formato do código. */
/* O `catch` é proposital (o import de .ts depende do type stripping do Node),
   mas NÃO pode sumir em silêncio: sem a asserção abaixo, uma falha de import
   apagaria as cinco checagens de aritmética e o teste seguiria verde. */
const { torPushRecovery } = await import(
  "file://" + root("lib", "combat", "um-anel", "push.ts").replace(/\\/g, "/")
).catch(() => ({ torPushRecovery: null }));
ok("push.ts pôde ser importado para conferir a conta", typeof torPushRecovery === "function");
if (torPushRecovery) {
  for (const [perda, esperado] of [
    [7, 3],
    [8, 4],
    [1, 0],
    [0, 0],
    [3, 1],
  ]) {
    ok(`perder ${perda} devolve ${esperado}`, torPushRecovery(perda) === esperado, `deu ${torPushRecovery(perda)}`);
  }
}

/* ── 3. A oferta e seus limites ────────────────────────────────────────── */

const attackCode = stripComments(ATTACK);
ok("token guarda a oferta de Empurrão", /pushOffer\?:/.test(TYPES));
ok("token guarda a rodada em que já foi empurrado", /pushedRound\?:/.test(TYPES));
ok(
  "ataque grava a oferta só para herói que perdeu Resistência",
  /if \(result\.hit && result\.enduranceLoss > 0 && defCombat\.kind === "hero"\)/.test(attackCode),
  "adversário não pode ser empurrado, e sem perda não há o que amortecer"
);

const handlerCode = stripComments(HANDLER);
ok(
  "handler recusa adversário",
  /if \(combat\.kind !== "hero"\) return \{ ok: false, error: "Adversários não podem ser empurrados" \}/.test(
    handlerCode
  )
);
ok("handler respeita uma vez por rodada", /torPushAvailable\(/.test(handlerCode));
ok(
  "a oferta vale só na rodada do golpe",
  /params\.offer\.round !== params\.round/.test(pushCode),
  "sem isso um golpe da rodada 1 seria amortecido na rodada 5"
);
ok("já empurrado não repete", /params\.pushedRound === params\.round/.test(pushCode));
ok(
  "recuperar não passa da Resistência máxima",
  /Math\.min\(vidaMax, \(token\.vida \?\? 0\) \+ recovery\)/.test(handlerCode)
);
/* Se o golpe zerou a Resistência, amortecer devolve o herói ao combate — a
   marca de derrotado precisa sair junto, senão ele fica de pé e fora ao mesmo
   tempo. */
ok(
  "amortecer tira a marca de derrotado quando sobra Resistência",
  /defeated: nextVida > 0 \? undefined : token\.defeated/.test(handlerCode)
);
ok("Resistência volta pra ficha", /patchTorCharacterResources\(sheetId/.test(handlerCode));
ok(
  "confere o dono da ficha quando não é o Mestre",
  /canonicalId !== sheet\.ownerId/.test(handlerCode)
);
ok("recusa mesa que não seja do Um Anel", /rpgSystemId !== "um-anel"/.test(handlerCode));
ok(
  "rota usa apelido como autor",
  existsSync(PUSH_ROUTE) &&
    /authorName: session\.user\.nickname\?\.trim\(\) \|\| "Jogador"/.test(readFileSync(PUSH_ROUTE, "utf8"))
);

/* O custo do livro não é cobrado pelo app — a VTT não modela ação principal no
   Um Anel. A mensagem tem de dizer isso, senão a mesa esquece de cobrar. */
ok(
  "mensagem lembra que gasta a próxima ação principal",
  /Gasta a próxima ação principal recuperando a posição/.test(handlerCode)
);
ok("popup oferece o Empurrão ao herói atingido", /Ser empurrado \(\+\$\{pushRecovery\}\)/.test(POPUP));

/* ── 4. Variante de NA 18 ──────────────────────────────────────────────── */

ok(
  "livro descreve a regra opcional",
  /os jogadores e o Mestre podem combinar derivar os NAs subtraindo os Atributos de \*\*18\*\* em vez disso/.test(
    CAP2
  )
);
ok("attributeTN aceita a base", /export function attributeTN\(score: number, base = 20\)/.test(RULES));
ok(
  "20 continua o padrão",
  /base = 20/.test(RULES),
  "mesa que não escolheu nada tem de seguir no livro-padrão"
);

/* Regressão real: `resolve-attack.ts` tinha a fórmula DUPLICADA. Com a base
   virando opção, as duas cópias divergiriam na primeira mesa que ligasse 18. */
const resolveCode = stripComments(RESOLVE);
ok(
  "resolve-attack não duplica a fórmula do NA",
  !/function attributeTN\(/.test(resolveCode),
  "duas cópias divergiriam assim que uma mesa ligasse a variante"
);
ok("resolve-attack usa a base recebida", /attributeTN\(params\.attackerStrength \?\? 0, params\.attributeTnBase\)/.test(resolveCode));

const sessionCode = stripComments(SESSION);
ok("a opção mora no estado da mesa", /attributeTnBase\?: 18 \| 20;/.test(SESSION));
ok(
  "só 18 é aceito; qualquer outro valor cai no padrão",
  /r\.attributeTnBase === 18 \? \(18 as const\) : undefined/.test(sessionCode),
  "estado de sala vem de JSONB e não é confiável"
);
ok(
  "desligar apaga em vez de gravar 20",
  /if \(patch\.attributeTnBase === 18\) next\.attributeTnBase = 18;\s*\n?\s*else delete next\.attributeTnBase;/.test(
    sessionCode
  ),
  "gravar 20 deixaria 'nunca mexeu' e 'desligou' indistinguíveis"
);
ok("ataque usa a base da mesa", /attributeTnBase: torAttributeTnBase\(room\.torSession\)/.test(attackCode));
/* A assinatura virou objeto de opções quando o Bônus de Esperança entrou —
   `attributeTnBase` deixou de ser posicional. A garantia é a mesma: a Tarefa de
   Combate rola Perícia, então tem de usar a base de NA da mesa. */
ok(
  "Tarefa de Combate usa a base da mesa",
  /rollTorSkillCheck\(sheet, task\.skill, \{\s*\n?\s*attributeTnBase: torAttributeTnBase\(room\.torSession\),/.test(
    stripComments(TASK)
  ),
  "a tarefa rola Perícia — tem de seguir a mesma regra da mesa"
);
ok("painel de campanha oferece a opção", /Números-Alvo derivados de 18/.test(FELLOW));
ok(
  "só o Mestre marca a opção",
  /disabled=\{busy \|\| !canManage\}/.test(FELLOW),
  "é regra de mesa, não de jogador"
);

/* Limite conhecido e registrado: a ficha aberta FORA de uma sala não conhece a
   mesa e cai em 20. O parâmetro existe justamente para quem conhece passar. */
ok(
  "rolagem de ficha aceita a base, mesmo caindo no padrão sozinha",
  /attributeTnBase\?: number;/.test(readFileSync(root("lib", "character", "um-anel", "dice.ts"), "utf8")) &&
    /opts: TorRollOptions = \{\}/.test(readFileSync(root("lib", "character", "um-anel", "dice.ts"), "utf8"))
);

console.log(`\n  ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
