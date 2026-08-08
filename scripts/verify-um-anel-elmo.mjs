/**
 * Elmo removível em combate — e a fotografia que envelhecia.
 *
 * Por que existe: o livro trata tirar o Elmo como jogada tática —
 *
 * > "O valor de PROTEÇÃO de uma armadura é anotado separadamente daquele de um
 * > elmo (pois, às vezes, durante o combate, um herói pode recorrer a
 * > descartá-lo para reduzir a Carga carregada e evitar ficar Exausto muito
 * > cedo)." (03-aventureiros.md)
 *
 * — e o app não tinha a jogada. `removable: true` estava em `data.ts` desde o
 * começo com um único consumidor: uma dica de tooltip no compêndio.
 *
 * O achado maior veio junto: `token.torCombat.protectionDice` é uma FOTOGRAFIA
 * tirada quando o herói entra em cena, e o Teste de Proteção lia essa foto. Ou
 * seja: tirar o Elmo pela ficha aliviava a Carga (porque Exausto é derivado e
 * lido da ficha a cada ataque) e **mantinha o dado de Proteção** — o herói
 * ficava com os dois benefícios. Trocar de armadura no meio da luta tinha o
 * mesmo problema. É a mesma família do bônus de escudo, que já foi guardado e já
 * divergiu.
 *
 * E as duas metades custam ações DIFERENTES: tirar é secundária, recuperar é
 * principal — tratar as duas igual apagaria o custo da volta, que é o que
 * equilibra a jogada.
 *
 * Fonte: livros/um-anel/03-aventureiros.md e
 * livros/um-anel/06-fases-de-aventura-combate.md §Ações.
 */
import { readFileSync as rawReadFileSync, existsSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const CAP3 = readFileSync(root("livros", "um-anel", "03-aventureiros.md"), "utf8");
const CAP6 = readFileSync(root("livros", "um-anel", "06-fases-de-aventura-combate.md"), "utf8");

const GEAR = readFileSync(root("lib", "combat", "um-anel", "gear-in-combat.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-helm.ts"), "utf8");
const ATTACK = readFileSync(root("lib", "room", "handlers", "tor-combat-attack.ts"), "utf8");
const RULES = readFileSync(root("lib", "character", "um-anel", "rules.ts"), "utf8");
const DATA = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");
const TOKEN = readFileSync(root("lib", "vtt", "tor-player-token.ts"), "utf8");
const TYPES = readFileSync(root("lib", "vtt", "types.ts"), "utf8");
const CONTROL = readFileSync(root("components", "vtt", "TorHelmControl.tsx"), "utf8");
const STATUS = readFileSync(root("components", "vtt", "TokenStatusBody.tsx"), "utf8");
const SYNC = readFileSync(root("hooks", "useRoomSync.ts"), "utf8");
const ROUTE_PATH = root("app", "api", "room", "[roomId]", "tor-helm", "route.ts");

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

console.log("verify-um-anel-elmo: tirar o Elmo troca Proteção por Carga, e o Teste lê a ficha");

/* ── 1. O livro ────────────────────────────────────────────────────────── */

ok(
  "livro: a Proteção do elmo é anotada à parte porque ele pode ser descartado na luta",
  /O valor de PROTEÇÃO de uma armadura é anotado separadamente daquele de um elmo \(pois, às vezes, durante o combate, um herói pode recorrer a descartá-lo para reduzir a Carga carregada e evitar ficar Exausto muito cedo\)/.test(
    CAP3
  )
);
ok(
  "livro: remover o elmo é ação SECUNDÁRIA",
  /- Remover um elmo ou soltar um escudo ou arma, por exemplo para reduzir a Carga\./.test(CAP6)
);
ok(
  "livro: recuperar o elmo é ação PRINCIPAL",
  /- Recuperar sua arma, elmo ou escudo que foi derrubado anteriormente\./.test(CAP6)
);
ok("livro: Elmo dá +1d de Proteção e Carga 4", /\| Elmo\* \| \+1d \| 4 \|/.test(CAP3));
ok(
  "código: a tabela bate com o livro",
  /id: "elmo",\s*\n\s*label: "Elmo",\s*\n\s*protection: "\+1d",\s*\n\s*load: 4,/.test(DATA)
);
ok("código: e o Elmo é marcado removível", /removable: true/.test(DATA));

/* ── 2. A conta, rodando de verdade ────────────────────────────────────── */

const mod = await import(
  "file://" + root("lib", "combat", "um-anel", "gear-in-combat.ts").replace(/\\/g, "/")
).catch(() => null);
ok("gear-in-combat.ts pôde ser importado para conferir a conta", mod != null);

if (mod) {
  const { torHelmSwap, formatTorHelmMessage, TOR_HELM_REMOVE_ACTION, TOR_HELM_RECOVER_ACTION } = mod;

  ok("tirar custa a ação secundária", TOR_HELM_REMOVE_ACTION === "secundária");
  ok(
    "recuperar custa a ação principal",
    TOR_HELM_RECOVER_ACTION === "principal",
    "tratar as duas igual apagaria o custo da volta"
  );

  /* Herói de Cota de Malha (9) + Elmo (4) = 13 de equipamento, 2 de Fadiga,
     Resistência 16. Com Elmo a Carga total é 15 — ainda não Exausto. */
  const tirar = torHelmSwap({
    wearingBefore: true,
    equipmentLoadBefore: 13,
    equipmentLoadAfter: 9,
    fatigue: 2,
    protectionBefore: 4,
    protectionAfter: 3,
    enduranceValue: 16,
  });
  ok("tirar o Elmo alivia 4 de Carga", tirar.loadDelta === -4);
  ok("tirar o Elmo custa 1 dado de Proteção", tirar.protectionDelta === -1);
  ok("a ação devolvida é a de tirar", tirar.action === "secundária");
  ok("e o herói passa a NÃO usar Elmo", tirar.wearing === false);

  /* A Carga que decide Exausto é a TOTAL: equipamento + Fadiga. Aqui a
     Resistência 14 está abaixo dos 15 com Elmo e acima dos 11 sem. */
  const saiuDoExausto = torHelmSwap({
    wearingBefore: true,
    equipmentLoadBefore: 13,
    equipmentLoadAfter: 9,
    fatigue: 2,
    protectionBefore: 4,
    protectionAfter: 3,
    enduranceValue: 14,
  });
  ok(
    "tirar o Elmo pode tirar o herói de Exausto",
    saiuDoExausto.wearyBefore === true && saiuDoExausto.wearyAfter === false,
    "é exatamente para isso que a regra existe"
  );
  ok(
    "a Fadiga entra na conta do Exausto",
    torHelmSwap({
      wearingBefore: true,
      equipmentLoadBefore: 13,
      equipmentLoadAfter: 9,
      fatigue: 0,
      protectionBefore: 4,
      protectionAfter: 3,
      enduranceValue: 14,
    }).wearyBefore === false,
    "sem os 2 de Fadiga o mesmo herói não estava Exausto — comparar só com o equipamento erraria"
  );

  const recuperar = torHelmSwap({
    wearingBefore: false,
    equipmentLoadBefore: 9,
    equipmentLoadAfter: 13,
    fatigue: 2,
    protectionBefore: 3,
    protectionAfter: 4,
    enduranceValue: 16,
  });
  ok("recuperar devolve a Carga", recuperar.loadDelta === 4);
  ok("recuperar devolve o dado de Proteção", recuperar.protectionDelta === 1);
  ok("recuperar custa a ação principal", recuperar.action === "principal");
  ok(
    "recuperar pode DEIXAR o herói Exausto",
    torHelmSwap({
      wearingBefore: false,
      equipmentLoadBefore: 9,
      equipmentLoadAfter: 13,
      fatigue: 2,
      protectionBefore: 3,
      protectionAfter: 4,
      enduranceValue: 14,
    }).wearyAfter === true,
    "a regra vale nos dois sentidos"
  );

  /* A mensagem só fala de Exausto quando a condição VIRA — dizer o estado toda
     vez enterraria a informação que importa. */
  ok(
    "a mensagem anuncia a saída do Exausto",
    /deixa de estar EXAUSTO/.test(formatTorHelmMessage("Bilbo", saiuDoExausto))
  );
  ok(
    "e não fala de Exausto quando nada mudou",
    !/EXAUSTO/.test(formatTorHelmMessage("Bilbo", tirar))
  );
  ok(
    "a mensagem diz qual ação foi gasta",
    /ação secundária/.test(formatTorHelmMessage("Bilbo", tirar)) &&
      /ação principal/.test(formatTorHelmMessage("Bilbo", recuperar))
  );
}

/* ── 3. A fotografia que envelhecia ────────────────────────────────────── */

const attackCode = stripComments(ATTACK);
ok(
  "o Teste de Proteção do HERÓI lê a ficha",
  /defenderProtectionDice = computeProtectionDice\(defSheet\.armour\);/.test(attackCode),
  "ler o token deixava o herói tirar o Elmo e ficar com o dado de Proteção mesmo assim"
);
ok(
  "o adversário continua usando o valor do token",
  /let defenderProtectionDice = defCombat\.protectionDice;/.test(attackCode),
  "adversário não tem ficha — é ali que o valor do token é a verdade"
);
/* NEGATIVA: ninguém pode "otimizar" isso de volta para o token. */
ok(
  "o parâmetro do motor NÃO volta a ler o token direto",
  !/defenderProtectionDice: defCombat\.protectionDice/.test(attackCode),
  "era assim antes, e é o que fazia a foto velha decidir o Golpe Perfurante"
);
/* A leitura da ficha tem de vir ANTES de montar os parâmetros do motor —
   ancorado nas CHAMADAS, não nos imports. */
const leu = attackCode.indexOf("defenderProtectionDice = computeProtectionDice(");
const usou = attackCode.indexOf("defenderProtectionDice,");
ok(
  "lê a ficha ANTES de montar os parâmetros do ataque",
  leu > 0 && usou > 0 && leu < usou,
  `leu=${leu} usou=${usou}`
);
ok(
  "computeProtectionDice soma armadura e elmo",
  /if \(armour\.helm\) total \+= parseProtectionDice\(ARMOUR_BY_ID\.elmo\.protection\);/.test(
    stripComments(RULES)
  )
);
ok(
  "e computeLoad cobra a Carga do elmo (metade para Anões)",
  /if \(armour\.helm\) \{[\s\S]{0,240}cultureId === "anoes" \? Math\.ceil\(helmLoad \/ 2\) : helmLoad/.test(
    stripComments(RULES)
  )
);

/* ── 4. O caminho ──────────────────────────────────────────────────────── */

ok("a rota existe", existsSync(ROUTE_PATH));
const routeCode = stripComments(readFileSync(ROUTE_PATH, "utf8"));
ok(
  "a rota NÃO exige gerenciar a mesa — tirar o próprio elmo é do jogador",
  !/requireRoomManage/.test(routeCode)
);
ok(
  "a rota manda o apelido para o chat, nunca o nome da conta",
  /authorName: session\.user\.nickname\?\.trim\(\) \|\| "Jogador"/.test(routeCode)
);

const handlerCode = stripComments(HANDLER);
ok(
  "handler aceita o dono da ficha ou o Mestre",
  /if \(!isGm\) \{[\s\S]{0,220}account\.canonicalId !== sheet\.ownerId/.test(handlerCode)
);
ok("handler recusa adversário", /combat\?\.kind !== "hero"/.test(handlerCode));
ok(
  "handler grava o Elmo na FICHA",
  /patchTorCharacterResources\(sheet\.id, \{ armour: armourAfter \}, author\.authorId\)/.test(
    handlerCode
  ),
  "Carga, Exausto e Proteção saem todos de `armour` — uma verdade só"
);
ok(
  "handler inverte o estado atual em vez de receber um alvo",
  /helm: !armourBefore\.helm/.test(handlerCode),
  "receber o alvo do cliente deixaria duas telas discordarem sobre o estado"
);
ok(
  "handler usa a conta do motor",
  /torHelmSwap\(\{/.test(handlerCode) && /formatTorHelmMessage\(token\.name, swap\)/.test(handlerCode)
);
/* Grava antes de anunciar — ancorado nas CHAMADAS. */
const gravou = handlerCode.indexOf("patchTorCharacterResources(sheet.id");
const anunciou = handlerCode.indexOf("appendRoomChatMessage(room");
ok(
  "grava a ficha ANTES de anunciar no chat",
  gravou > 0 && anunciou > 0 && gravou < anunciou,
  `gravou=${gravou} anunciou=${anunciou}`
);
ok(
  "e atualiza o espelho do token para não deixar número velho para trás",
  /protectionDice: swap\.protectionDice, helm: swap\.wearing/.test(handlerCode)
);

/* ── 5. O espelho é assumido como espelho ──────────────────────────────── */

ok("o token tem o campo de exibição do Elmo", /helm\?: boolean;/.test(TYPES));
ok(
  "o campo é opcional — sala salva não precisa de migração",
  /helm\?: boolean;/.test(TYPES) && !/\n  helm: boolean;/.test(TYPES)
);
ok(
  "o token nasce com o Elmo da ficha",
  /helm: Boolean\(sheet\.armour\.helm\)/.test(stripComments(TOKEN))
);

const controlCode = stripComments(CONTROL);
ok("o controle é só de herói", /combat\?\.kind !== "hero"\) return null;/.test(controlCode));
ok(
  "o botão diz qual ação cada metade custa",
  /TOR_HELM_REMOVE_ACTION/.test(controlCode) && /TOR_HELM_RECOVER_ACTION/.test(controlCode),
  "sem isso a mesa não sabe que a volta é mais cara que a saída"
);
ok(
  "o botão avisa o preço em Proteção",
  /perde 1 dado de Proteção/.test(controlCode) && /Devolve 1 dado de Proteção/.test(controlCode)
);
ok("o painel do token renderiza o controle", /<TorHelmControl/.test(STATUS));
ok("o hook expõe a chamada", /export async function postRoomTorHelm\(/.test(SYNC));
ok("o hook aponta para a rota certa", /`\/api\/room\/\$\{roomId\}\/tor-helm`/.test(SYNC));

/* ── 6. Nada ficou desligado ───────────────────────────────────────────── */

const consumidores = handlerCode + controlCode;
for (const fn of [
  "torHelmSwap",
  "formatTorHelmMessage",
  "TOR_HELM_REMOVE_ACTION",
  "TOR_HELM_RECOVER_ACTION",
]) {
  ok(`${fn} tem consumidor fora de gear-in-combat.ts`, new RegExp(`\\b${fn}\\b`).test(consumidores));
}
ok(
  "gear-in-combat.ts não importa nada em runtime",
  !/^import /m.test(stripComments(GEAR)),
  "é o que permite ao teste importar o arquivo e conferir a conta com números"
);

console.log(`\nverify-um-anel-elmo: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
