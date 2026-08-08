/**
 * Ódio / Resolução e Habilidades Sinistras chegam à mesa.
 *
 * Por que existe: `hate`, `hateKind` e `fellAbilities` estavam em
 * `adversaries.ts` e **não apareciam em mais lugar nenhum do app**. O token não
 * carregava, nenhuma tela mostrava, nada consumia — metade do bloco do
 * adversário era decorativa, e o Mestre não tinha onde ver nem como gastar.
 *
 * É o mesmo padrão que já tinha pegado as posturas: dado/motor pronto e
 * desligado, passando nos testes porque ninguém testava o CAMINHO.
 *
 * Critério de mecanização (o mesmo das Virtudes): o que é gasto OPCIONAL do
 * Mestre não dispara sozinho — o app põe o texto e o contador na frente de quem
 * decide. Só o efeito automático (Exausto sem pontos) é aplicado pelo servidor.
 *
 * Fonte: livros/um-anel/08-mestre-e-adversarios.md
 */
import { readFileSync as rawReadFileSync, existsSync } from "fs";

/* Normaliza CRLF -> LF na leitura: âncoras de linha não devem depender de fim
   de linha (no Windows um clone novo entrega CRLF). */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const CAP8 = readFileSync(root("livros", "um-anel", "08-mestre-e-adversarios.md"), "utf8");
const ADV = readFileSync(root("lib", "character", "um-anel", "adversaries.ts"), "utf8");
const TYPES = readFileSync(root("lib", "vtt", "types.ts"), "utf8");
const TOKEN = readFileSync(root("lib", "character", "um-anel", "adversary-token.ts"), "utf8");
const ATTACK = readFileSync(root("lib", "room", "handlers", "tor-combat-attack.ts"), "utf8");
const TURN = readFileSync(root("lib", "room", "handlers", "combat-turn.ts"), "utf8");
const POPUP = readFileSync(root("components", "vtt", "TorAttackPopup.tsx"), "utf8");
const STATUS = readFileSync(root("components", "vtt", "TokenStatusBody.tsx"), "utf8");
const ROUTE = readFileSync(
  root("app", "api", "room", "[roomId]", "combat", "attack", "route.ts"),
  "utf8"
);

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

console.log("verify-um-anel-odio: Ódio/Resolução e Habilidades Sinistras na mesa");

/* ── 1. As regras existem no livro ─────────────────────────────────────── */

ok(
  "livro: Mestre gasta Ódio/Resolução pra ganhar (1d)",
  /reduzir o Ódio ou a Resolução de um adversário para fazê-lo \*ganhar \(1d\)\*/.test(CAP8)
);
ok(
  "livro: sem pontos no início da rodada, a criatura fica Exausta",
  /começa uma rodada sem pontos de Ódio ou Resolução, ela é considerada Exausta/.test(CAP8)
);
ok(
  "livro: o Mestre pode gastar o ÚLTIMO ponto numa Habilidade Sinistra",
  /mesmo quando ela exige o gasto do último ponto de Ódio ou Resolução/.test(CAP8)
);
ok("livro: Ódio é de lacaios do Inimigo", /\*\*ÓDIO:\*\*/.test(CAP8));
ok("livro: Resolução é de adversários não monstruosos", /\*\*RESOLUÇÃO:\*\*/.test(CAP8));

/* ── 2. O bloco viaja com o token ──────────────────────────────────────── */

for (const campo of ["hate?:", "hateMax?:", "hateKind?:", "fellAbilities?:", "weary?:"]) {
  ok(`token tem o campo ${campo.replace("?:", "")}`, TYPES.includes(campo));
}
const tokenCode = stripComments(TOKEN);
for (const campo of ["hate: stats.hate", "hateKind: stats.hateKind", "fellAbilities: stats.fellAbilities"]) {
  ok(`spawn copia ${campo.split(":")[0]}`, tokenCode.includes(campo), "ficava só no bestiário");
}
ok("Ódio inicial também vira o máximo", /hateMax: stats\.hate/.test(tokenCode));

/* Todo adversário do bestiário tem Ódio OU Resolução — se algum bloco vier sem,
   o contador na tela apareceria vazio sem explicação. */
/* Conta por `attributeLevel`, que só existe uma vez por adversário — contar por
   `id:` pegava também o `id` de cada ação de ataque dentro do bloco. */
const blocos = [...ADV.matchAll(/^ {4}attributeLevel: \d+,$/gm)].length;
const comHate = [...ADV.matchAll(/^ {4}hate: \d+,$/gm)].length;
const comKind = [...ADV.matchAll(/^ {4}hateKind: "(hate|resolve)",$/gm)].length;
ok("bestiário tem blocos", blocos >= 28, `achou ${blocos}`);
ok("todo bloco tem Ódio/Resolução", comHate === blocos, `${comHate} de ${blocos}`);
ok("todo bloco declara qual dos dois é", comKind === blocos, `${comKind} de ${blocos}`);

/* ── 3. O gasto é opcional e é do Mestre ───────────────────────────────── */

const attackCode = stripComments(ATTACK);
ok("gasto de Ódio é opção do ataque", /spendHate\?: boolean/.test(ATTACK));
ok(
  "gasto vira (1d) de Dado de Sucesso, não Favorecida",
  /attackerRank \+= 1;/.test(attackCode),
  "*ganha (1d)* é Dado de Sucesso — mexer em favoured daria dois Dados de Proeza"
);
ok(
  "recusa gastar sem pontos",
  /available <= 0/.test(attackCode),
  "gastar do zero deixaria o contador negativo"
);
ok("desconta o ponto ao resolver", /hate: Math\.max\(0, atkCombat\.hate - 1\)/.test(attackCode));
ok(
  "só o Mestre pode gastar",
  /spendHate: body\.torSpendHate === true && canManageRoom\(/.test(ROUTE),
  "jogador esvaziaria o Ódio do adversário chamando a rota direto"
);
/* Regressão nomeada: `canBypassCombatTurn` é um stub que devolve false sempre.
   Usá-lo como porteiro faria o gasto nunca funcionar, em silêncio. */
ok(
  "porteiro do gasto não é canBypassCombatTurn",
  !/spendHate:[^\n]*canBypassCombatTurn/.test(ROUTE) && !/spendHate:[^\n]*&& canBypass\b/.test(ROUTE),
  "canBypassCombatTurn hoje devolve false sempre — o gasto nunca dispararia"
);

/* Nenhuma Habilidade Sinistra pode disparar sozinha: quase todas são "gaste 1
   de Ódio para…", decisão do Mestre. */
for (const nome of ["Gente Feroz", "Velocidade Serpentina", "Força Horrenda", "Grito de Triunfo"]) {
  ok(
    `"${nome}" não é aplicada automaticamente`,
    !new RegExp(`\\b${nome}\\b`).test(stripComments(ATTACK)),
    "Habilidade Sinistra de gasto opcional não dispara sozinha"
  );
}

/* ── 4. Exausto sem pontos — e só na rodada seguinte ───────────────────── */

const turnCode = stripComments(TURN);
ok("Exaustão é aplicada na virada de rodada", /applyTorHateWearinessOnNewRound\(room\)/.test(turnCode));
ok(
  "Exaustão do Um Anel não vaza pro Eldarin",
  /rpgSystemId !== "um-anel"\) return;/.test(turnCode),
  "isolamento de hub"
);
ok("Exausto = sem pontos", /const weary = c\.hate <= 0;/.test(turnCode));
/* O ponto central: NÃO derivar de `hate <= 0` na hora da rolagem. O livro
   garante o direito de gastar o último ponto numa Habilidade Sinistra, e
   derivar na hora puniria esse gasto já na mesma rodada. */
ok(
  "ataque lê a flag, não recalcula pelo Ódio",
  /attackerWeary = Boolean\(atkCombat\.weary\)/.test(attackCode) &&
    !/attackerWeary = [^\n]*hate/.test(attackCode),
  "derivar de hate<=0 puniria o gasto do último ponto na mesma rodada"
);
ok(
  "adversário Exausto também rola Proteção pior",
  /defenderWeary = Boolean\(defCombat\.weary\)/.test(attackCode),
  "a condição não é privilégio do herói"
);

/* ── 5. O Mestre enxerga ───────────────────────────────────────────────── */

ok("popup mostra o contador", /\{combat\.hate\}\/\{combat\.hateMax/.test(POPUP));
ok("popup lista as Habilidades Sinistras", /combat\.fellAbilities\?\.length/.test(POPUP));
ok("popup oferece o gasto", /Gastar 1 de \{hateName\}/.test(POPUP));
ok(
  "caixa desmarca depois do ataque",
  /setSpendHate\(false\)/.test(POPUP),
  "deixar marcada gastaria de novo no clique seguinte sem o Mestre pedir"
);
ok(
  "não deixa marcar sem pontos",
  /disabled=\{busy \|\| combat\.hate <= 0\}/.test(POPUP)
);
ok("status do token mostra o contador", /"Resolução" : "Ódio"/.test(STATUS));

/* O nome muda conforme o tipo — chamar tudo de "Ódio" mandaria o Mestre procurar
   no bloco errado do capítulo 8. */
ok('popup escolhe entre "Ódio" e "Resolução"', /hateKind === "resolve" \? "Resolução" : "Ódio"/.test(POPUP));

ok(
  "UI sem emoji",
  !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(POPUP),
  "convenção do projeto: ícones só em SVG"
);

console.log(`\n  ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
