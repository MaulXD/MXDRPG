/**
 * Fontes de Dano fora do combate — e o Veneno.
 *
 * Por que existe: o capítulo 8 traz um sistema inteiro (Frio Extremo, Queda,
 * Fogo, Asfixia, Veneno) e **nada dele estava no motor**. A única forma de um
 * herói perder Resistência no app era levar um golpe: afogar, queimar, cair e
 * envenenar não existiam.
 *
 * A armadilha específica desta tabela é a INVERSÃO. Na Perda de Resistência o
 * Dado de Proeza é lido ao contrário do resto do jogo — a Runa é *Ileso* e o
 * Olho é *zero* —, e por isso a perda **moderada** rola *Favorecida* e a
 * **gravíssima** rola *Desfavorecida*. Trocar os dois faria o dano leve doer
 * mais que o mortal, e o teste de aritmética abaixo é o que segura isso.
 *
 * Fonte: livros/um-anel/08-mestre-e-adversarios.md §"Fontes de Dano" e §VENENO.
 */
import { readFileSync as rawReadFileSync, existsSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const CAP8 = readFileSync(root("livros", "um-anel", "08-mestre-e-adversarios.md"), "utf8");
const CAP6 = readFileSync(root("livros", "um-anel", "06-fases-de-aventura-combate.md"), "utf8");

const HAZARDS = readFileSync(root("lib", "combat", "um-anel", "hazards.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-hazard.ts"), "utf8");
const RECOVERY = readFileSync(root("lib", "room", "handlers", "tor-recovery.ts"), "utf8");
const PANEL = readFileSync(root("components", "vtt", "TorHazardPanel.tsx"), "utf8");
const STATUS = readFileSync(root("components", "vtt", "TokenStatusBody.tsx"), "utf8");
const TYPES = readFileSync(root("lib", "vtt", "types.ts"), "utf8");
const SYNC = readFileSync(root("hooks", "useRoomSync.ts"), "utf8");
const ROUTE_PATH = root("app", "api", "room", "[roomId]", "tor-hazard", "route.ts");

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

console.log("verify-um-anel-fontes-de-dano: o capítulo 8 chega à mesa");

/* ── 1. O livro ────────────────────────────────────────────────────────── */

ok(
  "livro: moderado rola Favorecida",
  /Se a perda de Resistência é moderada, o Mestre faz uma rolagem \*Favorecida\* de Dado de Proeza/.test(
    CAP8
  )
);
ok(
  "livro: gravíssima rola Desfavorecida",
  /Se a perda de Resistência é gravíssima, o Mestre faz uma rolagem \*Desfavorecida\* de Dado de Proeza/.test(
    CAP8
  )
);
ok(
  "livro: severa rola um Dado de Proeza sem modificador",
  /Se a perda de Resistência é severa, o Mestre rola um Dado de Proeza/.test(CAP8)
);
ok("livro: Olho reduz a zero", /Desacordado \| O herói-jogador é reduzido a zero de Resistência/.test(CAP8));
ok(
  "livro: 1–10 perde o resultado numérico",
  /Machucado \| O herói-jogador perde uma quantidade de Resistência igual ao resultado numérico/.test(
    CAP8
  )
);
ok("livro: Runa sai incólume", /Ileso \| O herói-jogador sai incólume/.test(CAP8));
ok(
  "livro: envenenado não pode descansar e rola ao fim de cada dia",
  /Um herói-jogador envenenado não pode descansar e deve rolar a perda de Resistência correspondente ao fim de cada dia/.test(
    CAP8
  )
);
ok(
  "livro: a Runa cura o veneno",
  /se a rolagem produzir um ᛥ, o herói não sofre dano e não está mais envenenado/.test(CAP8)
);
ok(
  "livro: a rolagem de CURA perde (1d) no Severo e (2d) no Gravíssimo",
  /a rolagem \*perde \(1d\)\* se o veneno é Severo, e \*perde \(2d\)\* se é Gravíssimo/.test(CAP8)
);
ok(
  "livro: zero de Resistência já derruba inconsciente por regra geral",
  /se sua Resistência for\s+reduzida a zero, caem inconscientes/.test(CAP6)
);
ok(
  "livro: Veneno leva a Morrendo ao chegar a zero",
  /\| Veneno \|[^\n]*O herói está Morrendo se cair a zero de Resistência\./.test(CAP8)
);
ok(
  "livro: Queda deixa Ferido ao chegar a zero",
  /\| Queda \|[^\n]*O herói fica Ferido se cair a zero de Resistência\./.test(CAP8)
);

/* ── 2. A conta, rodando de verdade ────────────────────────────────────── */

const mod = await import(
  "file://" + root("lib", "combat", "um-anel", "hazards.ts").replace(/\\/g, "/")
).catch(() => null);
ok("hazards.ts pôde ser importado para conferir a conta", mod != null);

if (mod) {
  const {
    resolveTorHazard,
    torPoisonHealingPenalty,
    TOR_HAZARD_LEVEL_META,
    TOR_HAZARD_SOURCE_META,
    isTorHazardLevel,
    isTorHazardSource,
  } = mod;

  const olho = { kind: "eye", numeric: 0 };
  const runa = { kind: "gandalf", numeric: 10 };
  const sete = { kind: "number", numeric: 7 };

  /* A INVERSÃO: no resto do jogo Favorecida é bom para quem rola, e aqui quem
     rola é o Mestre — mas o melhor resultado da tabela (Runa) é o que salva o
     herói, então Favorecida continua sendo o lado bom PARA O HERÓI. É por isso
     que o moderado é Favorecido e o gravíssimo é Desfavorecido. */
  ok(
    "moderado é Favorecida",
    TOR_HAZARD_LEVEL_META.moderado.featRoll === "favoured",
    "trocar com o gravíssimo faria o dano leve doer mais que o mortal"
  );
  ok("severo é rolagem simples", TOR_HAZARD_LEVEL_META.severo.featRoll === "normal");
  ok("gravíssimo é Desfavorecida", TOR_HAZARD_LEVEL_META.gravissimo.featRoll === "illFavoured");

  const comOlho = resolveTorHazard({ source: "queda", level: "severo", featDie: olho });
  ok("Olho reduz a zero, e não é 'perder 0'", comOlho.reducedToZero === true && comOlho.loss === 0);
  ok("Olho não é 'Ileso'", comOlho.unharmed === false);

  const comRuna = resolveTorHazard({ source: "fogo", level: "severo", featDie: runa });
  ok("Runa sai incólume, sem perder nada", comRuna.unharmed === true && comRuna.loss === 0);
  ok(
    "Runa NÃO é lida como 10 aqui",
    comRuna.loss !== 10,
    "a Runa vale 10 no resto do motor; nesta tabela ela é Ileso"
  );

  const numerico = resolveTorHazard({ source: "frio", level: "severo", featDie: sete });
  ok("resultado numérico vira a perda", numerico.loss === 7);
  ok("numérico não reduz a zero nem é ileso", !numerico.reducedToZero && !numerico.unharmed);

  ok(
    "Veneno: a Runa cura",
    resolveTorHazard({ source: "veneno", level: "severo", featDie: runa }).poisonCured === true
  );
  ok(
    "Veneno: qualquer outro resultado NÃO cura",
    resolveTorHazard({ source: "veneno", level: "severo", featDie: sete }).poisonCured === false &&
      resolveTorHazard({ source: "veneno", level: "severo", featDie: olho }).poisonCured === false
  );
  /* O lado OPOSTO: a Runa numa fonte que não é veneno não pode "curar" nada. */
  ok(
    "Runa em Fogo não cura veneno nenhum",
    resolveTorHazard({ source: "fogo", level: "severo", featDie: runa }).poisonCured === false
  );

  ok("Queda deixa Ferido a zero", TOR_HAZARD_SOURCE_META.queda.atZero === "ferido");
  ok("Fogo deixa Ferido a zero", TOR_HAZARD_SOURCE_META.fogo.atZero === "ferido");
  ok("Frio leva a Morrendo", TOR_HAZARD_SOURCE_META.frio.atZero === "morrendo");
  ok("Asfixia leva a Morrendo", TOR_HAZARD_SOURCE_META.asfixia.atZero === "morrendo");
  ok("Veneno leva a Morrendo", TOR_HAZARD_SOURCE_META.veneno.atZero === "morrendo");

  ok("CURA perde 0d contra veneno Moderado", torPoisonHealingPenalty("moderado") === 0);
  ok("CURA perde 1d contra veneno Severo", torPoisonHealingPenalty("severo") === 1);
  ok("CURA perde 2d contra veneno Gravíssimo", torPoisonHealingPenalty("gravissimo") === 2);

  ok(
    "a rota só aceita fonte e nível conhecidos",
    isTorHazardSource("veneno") === true &&
      isTorHazardSource("maldicao") === false &&
      isTorHazardLevel("gravissimo") === true &&
      isTorHazardLevel("mortal") === false
  );
}

/* ── 3. O caminho até a ficha ──────────────────────────────────────────── */

ok("a rota existe", existsSync(ROUTE_PATH));
const routeCode = stripComments(readFileSync(ROUTE_PATH, "utf8"));
ok(
  "a rota valida fonte e nível antes de chamar o handler",
  /isTorHazardSource\(body\.source\)/.test(routeCode) && /isTorHazardLevel\(body\.level\)/.test(routeCode)
);
ok(
  "a rota manda o apelido para o chat, nunca o nome da conta",
  /authorName: session\.user\.nickname\?\.trim\(\) \|\| "Jogador"/.test(routeCode)
);

const handlerCode = stripComments(HANDLER);
ok(
  "handler exige o Mestre",
  /if \(!canManageRoom\(room, user\)\) return \{ ok: false, error: "Só o Mestre aplica Fontes de Dano" \}/.test(
    handlerCode
  )
);
ok(
  "handler recusa adversário",
  /if \(!token \|\| combat\?\.kind !== "hero"\)/.test(handlerCode),
  "a tabela de Perda de Resistência é dos heróis-jogadores"
);
ok(
  "o Dado de Proeza é rolado no SERVIDOR",
  /rollTorCheck\(\{/.test(handlerCode),
  "um número vindo do cliente é um número que o cliente escolhe"
);
ok(
  "a rolagem usa o modificador do nível, não um fixo",
  /favoured: meta\.featRoll === "favoured"/.test(handlerCode) &&
    /illFavoured: meta\.featRoll === "illFavoured"/.test(handlerCode)
);
ok(
  "o Olho zera a Resistência em vez de subtrair",
  /outcome\.reducedToZero \? 0 : Math\.max\(0, nextVida - outcome\.loss\)/.test(handlerCode)
);
ok(
  "chegar a zero por Queda/Fogo marca Ferido",
  /if \(nextVida <= 0 && outcome\.atZero === "ferido"\) nextWounded = true;/.test(handlerCode)
);
ok(
  "a ficha recebe a Resistência e a Ferida",
  /\{ enduranceValue: nextVida, wounded: nextWounded \}/.test(handlerCode)
);
ok(
  "o veneno instala ou some conforme a rolagem",
  /nextPoison = outcome\.poisonCured \? undefined : action\.level;/.test(handlerCode)
);
ok(
  "a rolagem de CURA leva a penalidade do veneno como Dado de Sucesso negativo",
  /bonusDice: -penalidade/.test(handlerCode),
  "virar Desfavorecida seria outra regra: ela se cancela com Favorecida, o dado de Sucesso não"
);
ok(
  "só o sucesso na CURA tira o veneno",
  /if \(roll\.success\) nextPoison = undefined;/.test(handlerCode)
);
ok(
  "curar sem estar envenenado é recusado",
  /if \(!combat\.poison\) return \{ ok: false, error: `\$\{token\.name\} não está envenenado` \}/.test(
    handlerCode
  )
);

/* ── 4. Envenenado não descansa ────────────────────────────────────────── */

const recoveryCode = stripComments(RECOVERY);
ok(
  "o descanso procura o token do herói para ver o veneno",
  /t\.torCombat\.torCharacterId === sheet\.id/.test(recoveryCode)
);
ok(
  "envenenado é barrado nos DOIS descansos",
  /if \(poisonedToken\?\.torCombat\?\.poison\) \{/.test(recoveryCode) &&
    /action === "rest" \|\| action === "short-rest"/.test(recoveryCode),
  "o livro diz 'não pode descansar', sem distinguir curto de prolongado"
);
/* O bloqueio precisa vir ANTES da conta de recuperação — barrar depois de
   calcular seria decorativo. Ancorado nas CHAMADAS, não nos imports. */
const barrou = recoveryCode.indexOf("poisonedToken?.torCombat?.poison");
const calculou = recoveryCode.indexOf("torRestEnduranceRecovery({");
ok(
  "barra o envenenado ANTES de calcular a recuperação",
  barrou > 0 && calculou > 0 && barrou < calculou,
  `barrou=${barrou} calculou=${calculou}`
);

/* ── 5. Token e painel ─────────────────────────────────────────────────── */

ok("o token guarda o NÍVEL do veneno, não um booleano", /poison\?: import\(/.test(TYPES));
ok(
  "o campo é opcional — sala salva não precisa de migração",
  /poison\?:/.test(TYPES) && !/poison: /.test(TYPES)
);

const panelCode = stripComments(PANEL);
ok("o painel existe e é do herói", /combat\?\.kind !== "hero"\) return null;/.test(panelCode));
ok("o painel aplica a Fonte de Dano", /action: "apply", source, level/.test(panelCode));
ok(
  "o painel só oferece a CURA quando há veneno",
  /\{poison \?[\s\S]{0,900}action: "cure-poison", healerRank: r/.test(panelCode)
);
ok(
  "o painel mostra a penalidade do veneno na rolagem de CURA",
  /torPoisonHealingPenalty\(poison\) > 0/.test(panelCode)
);
ok(
  "o estado ENVENENADO aparece para o jogador também, fora do bloco do Mestre",
  panelCode.indexOf("ENVENENADO") > 0 &&
    panelCode.indexOf("ENVENENADO") < panelCode.indexOf("{canManage ?"),
  "é o veneno que impede o descanso — quem joga o herói precisa ver"
);
ok("o painel do token renderiza as Fontes de Dano", /<TorHazardPanel/.test(STATUS));
ok("o hook expõe a chamada", /export async function postRoomTorHazard\(/.test(SYNC));
ok("o hook aponta para a rota certa", /`\/api\/room\/\$\{roomId\}\/tor-hazard`/.test(SYNC));

/* ── 6. Nada ficou desligado ───────────────────────────────────────────── */

const hazardCode = stripComments(HAZARDS);
for (const fn of ["resolveTorHazard", "torPoisonHealingPenalty", "formatTorHazardMessage"]) {
  ok(
    `${fn} tem consumidor fora de hazards.ts`,
    new RegExp(`\\b${fn}\\b`).test(handlerCode + panelCode),
    "motor sem chamador é regra desligada"
  );
}
ok(
  "hazards.ts não importa nada em runtime (é o que deixa o teste conferir a conta)",
  !/^import /m.test(hazardCode.replace(/^import type[\s\S]*?;$/gm, ""))
);

console.log(`\nverify-um-anel-fontes-de-dano: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
