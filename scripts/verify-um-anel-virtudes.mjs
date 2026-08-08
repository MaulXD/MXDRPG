/**
 * Amarra as Virtudes que MEXEM NA ROLAGEM ao texto do livro.
 *
 * Por que existe: `sheet.virtues` era uma lista de ids decorativa. A Virtude
 * aparecia na ficha e nunca chegava a `rollTorCheck` — Bilbo pré-gerado tem
 * "Certeiro no Alvo" ("todos os seus ataques à distância são Favorecidos") e
 * atirava de arco com rolagem normal.
 *
 * O teste é bidirecional de propósito:
 *  - toda Virtude mecanizada tem de ter, no capítulo 5, a frase que a autoriza;
 *  - nenhuma Virtude OPCIONAL ("você PODE tornar Favorecida") pode estar
 *    mecanizada — ligar automaticamente gastaria o uso do jogador sem ele pedir.
 *
 * Fonte: livros/um-anel/05-valor-e-sabedoria.md
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
const VIRTUES_TS = readFileSync(root("lib", "character", "um-anel", "virtues.ts"), "utf8");
const CULTURAL_TS = readFileSync(root("lib", "character", "um-anel", "cultural-virtues.ts"), "utf8");
const RULES_TS = readFileSync(root("lib", "character", "um-anel", "rules.ts"), "utf8");
const DICE_TS = readFileSync(root("lib", "character", "um-anel", "dice.ts"), "utf8");
const RESOLVE_TS = readFileSync(root("lib", "combat", "um-anel", "resolve-attack.ts"), "utf8");
const HANDLER_TS = readFileSync(root("lib", "room", "handlers", "tor-combat-attack.ts"), "utf8");
const SHEET_TSX = readFileSync(
  root("components", "character", "sheet", "TorCharacterSheetView.tsx"),
  "utf8"
);
const PDF_TSX = readFileSync(root("components", "character", "TorSheetPdfDocument.tsx"), "utf8");

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

/** Remove comentários de bloco e de linha — asserções negativas não podem casar
 *  com a própria justificativa escrita no comentário. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

console.log("verify-um-anel-virtudes: Virtudes que entram na rolagem × capítulo 5");

/* ── 1. Cada Virtude mecanizada tem respaldo no livro ──────────────────── */

/**
 * `bookPhrase` é a frase do capítulo 5 que autoriza o efeito. Se a tradução do
 * capítulo mudar a ponto de a frase sumir, o teste falha — e é isso que se quer:
 * regra sem fonte no livro não pode continuar mecanizada.
 */
const MECANIZADAS = [
  {
    id: "certeiro-no-alvo",
    heading: "CERTEIRO NO ALVO",
    bookPhrase: /ataques à distância são \*Favorecidos\*/,
    ctxKind: "attack",
  },
  {
    id: "matador-de-dragoes",
    heading: "MATADOR DE DRAGÕES",
    bookPhrase: /criaturas com Vigor \(Might\) 2 ou mais, todas as suas rolagens de ataque são \*Favorecidas\*/,
    ctxKind: "attack",
  },
  {
    id: "duro-como-pedra",
    heading: "DURO COMO PEDRA",
    bookPhrase: /rolagens de PROTEÇÃO são \*Favorecidas\*, desde que você não esteja Arrasado/,
    ctxKind: "protection",
  },
  {
    id: "duro-como-raiz-velha",
    heading: "DURO COMO RAIZ VELHA",
    bookPhrase: /gravidade do seu ferimento, você rola dois Dados de Proeza em vez de um e escolhe o melhor/,
    ctxKind: "wound-severity",
  },
  {
    id: "contra-o-invisivel",
    heading: "CONTRA O INVISÍVEL",
    bookPhrase: /Testes de Sombra devidos a Pavor são \*Favorecidos\*/,
    ctxKind: "shadow-test",
  },
];

for (const v of MECANIZADAS) {
  ok(`capítulo 5 tem a seção ${v.heading}`, CAP5.includes(`**${v.heading}**`));
  ok(`${v.id}: livro autoriza o efeito`, v.bookPhrase.test(CAP5), String(v.bookPhrase));
  ok(`${v.id}: existe em cultural-virtues.ts`, CULTURAL_TS.includes(`id: "${v.id}"`));
  ok(`${v.id}: mecanizada em virtues.ts`, VIRTUES_TS.includes(`has("${v.id}")`));
}

/* ── 2. Virtudes OPCIONAIS não podem estar mecanizadas ─────────────────── */

/* O livro escreve "você PODE" nestas — o gatilho é do jogador, não do servidor.
   Ligar automaticamente queimaria o uso ("uma vez por combate") sem ele pedir. */
const OPCIONAIS = ["baruk-khazad", "coragem-desesperada", "realeza-revelada", "alto-destino"];
const virtuesCode = stripComments(VIRTUES_TS);
for (const id of OPCIONAIS) {
  ok(
    `${id} NÃO é aplicada automaticamente`,
    !new RegExp(`has\\("${id}"\\)`).test(virtuesCode),
    "Virtude opcional/condicional não pode disparar sozinha"
  );
}

/* Alto Destino também não pode entrar no bônus fixo de derivadas: o +2 de
   Esperança máxima só existe DEPOIS de a Virtude salvar o herói de uma Ferida
   mortal. Somar na criação daria o bônus antes do gatilho. */
ok(
  "alto-destino fora de torVirtueDerivedBonus",
  !stripComments(RULES_TS).includes("alto-destino"),
  "bônus condicional não pode entrar nas derivadas"
);

/* ── 3. Inspirado ≠ Favorecida ─────────────────────────────────────────── */

/* Inspirado dobra o bônus de gastar Esperança — ganha (2d) de Dado de SUCESSO —
   e não dá segundo Dado de Proeza. Confundir os dois é o erro mais fácil aqui:
   três Virtudes Culturais concedem Inspirado e nenhuma delas favorece. */
ok(
  "livro define Inspirado como (2d) de Esperança, não como Favorecida",
  /Inspirad[oa]s? dobram o benefício de gastar um ponto de Esperança/.test(
    readFileSync(root("livros", "um-anel", "02-resolucao-de-acoes.md"), "utf8")
  )
);
const INSPIRADO_ONLY = ["escuro-para-trabalho-escuro", "bravo-no-aperto"];
for (const id of INSPIRADO_ONLY) {
  ok(
    `${id} concede Inspirado e NÃO Favorecida`,
    !new RegExp(`has\\("${id}"\\)`).test(virtuesCode),
    "Inspirado não vira segundo Dado de Proeza"
  );
}

/* ── 4. As Virtudes chegam mesmo às rolagens ───────────────────────────── */

ok(
  "rollTorCombatProficiencyCheck consulta as Virtudes",
  /favoured: virtue\.favoured/.test(stripComments(DICE_TS)),
  "voltou a ser `favoured: false` fixo"
);
ok(
  "só Arcos conta como à distância na rolagem avulsa",
  /TOR_RANGED_PROFICIENCIES = \["arcos"\] as const/.test(VIRTUES_TS),
  "Lanças têm arremesso opcional — favorecê-las daria a Virtude no corpo a corpo"
);
ok(
  "resolve-attack aceita Proteção Favorecida",
  stripComments(RESOLVE_TS).includes("defenderProtectionFavoured")
);
ok(
  "resolve-attack aceita Severidade Favorecida",
  /rollWoundSeverity\(params\.defenderWoundSeverityFavoured\)/.test(stripComments(RESOLVE_TS))
);
ok(
  "handler calcula Favorecida do atacante pelas Virtudes",
  /attackerFavoured = virtue\.favoured/.test(stripComments(HANDLER_TS))
);
ok(
  "handler passa o Vigor do alvo pra Matador de Dragões",
  /targetMight:/.test(stripComments(HANDLER_TS)),
  "sem o Vigor, a Virtude nunca dispara"
);

/* Regressão do buraco que existia: o handler preenchia illFavoured do atacante
   mas nunca favoured — e o motor recebia o campo sempre vazio. */
ok(
  "handler passa attackerFavoured ao motor",
  /\battackerFavoured,/.test(stripComments(HANDLER_TS))
);

/* ── 5. `attackIsRanged` continua desligado enquanto não houver postura ── */

/* Passar `attackIsRanged` hoje barraria TODO ataque de arco: a postura nunca é
   escolhida em lugar nenhum, cai sempre em Aberta, e `canAttackFromStance`
   responde "ataques à distância exigem a postura de Retaguarda". A Virtude usa
   o mesmo dado (`weapon.ranged`) sem passar pelo portão de postura. */
ok(
  "handler NÃO liga attackIsRanged antes das posturas",
  !/attackIsRanged:/.test(stripComments(HANDLER_TS)),
  "ligar sem escolher postura bloqueia todo ataque à distância"
);

/* ── 6. Virtude nenhuma some da ficha nem sai como id no PDF ───────────── */

ok(
  "ficha resolve Virtude por torVirtueInfo (inicial + Cultural)",
  /torVirtueInfo\(id\)/.test(SHEET_TSX),
  "voltou a resolver só contra STARTING_VIRTUES e engole Virtude Cultural"
);
ok(
  "ficha não filtra Virtude desconhecida pra fora",
  !/character\.virtues[\s\S]{0,120}?\.filter\(Boolean\)/.test(SHEET_TSX),
  "filter(Boolean) faz a Virtude sumir da tela sem aviso"
);
ok("PDF imprime o nome da Virtude, não o id", /torVirtueInfo\(v\)\.label/.test(PDF_TSX));
ok(
  "PDF imprime o nome da Recompensa, não o id",
  /STARTING_REWARDS\.find\(\(d\) => d\.id === r\)\?\.label/.test(PDF_TSX)
);

/* ── 7. Bônus fixos de Esperança das Virtudes Culturais ────────────────── */

const HOPE_PLUS_1 = [
  "beleza-das-estrelas",
  "elbereth-gilthoniel",
  "espirito-indomavel",
  "poney-de-bri",
];
for (const id of HOPE_PLUS_1) {
  const virtue = CULTURAL_TS.match(new RegExp(`id: "${id}"[\\s\\S]{0,600}?\\},`));
  ok(
    `${id}: descrição diz +1 de Esperança máxima`,
    Boolean(virtue) && /Esperança máxima em 1|máximo de Esperança/.test(virtue[0]),
    "texto da Virtude não confirma o bônus somado em rules.ts"
  );
  ok(`${id}: somado em torVirtueDerivedBonus`, RULES_TS.includes(`"${id}"`));
}

/* ── 8. Uma Virtude, um nome só ────────────────────────────────────────── */

/**
 * Mesmo furo que `verify-um-anel-equipamento.mjs` pega em armas, agora em
 * Virtudes: capítulos traduzidos por agentes diferentes batizaram a MESMA
 * Virtude de formas diferentes, e o app usava uma terceira. Casos reais que
 * motivaram este bloco:
 *
 *  - "MIRA CERTEIRA" (cap. 5) × "Certeiro no Alvo" (código e ficha do Bilbo no
 *    cap. 11) — o Mestre não achava no livro a Virtude que a ficha mostrava;
 *  - "RESISTENTE COMO RAÍZES ANTIGAS" (cap. 5) × "Duro como Raiz de Árvore
 *    Velha" (cap. 12) × "Duro como Raiz Velha" (código) — três nomes;
 *  - "PERÍCIA DOS ELDAR" (cap. 10) × "Habilidade dos Eldar" (código), sendo que
 *    "Habilidade" já é Habilidade Sinistra.
 *
 * Ao todo eram 14 divergências. O teste vale nas duas direções: toda Virtude do
 * código precisa de um título igual em algum capítulo, e todo título de Virtude
 * dos capítulos precisa existir no código.
 */
/* Do capítulo 10 interessa só a seção das Virtudes dos Altos-Elfos: o resto do
   capítulo usa `**Negrito** — texto` para legendas de mapa e tabelas, que
   entrariam como se fossem nomes de Virtude. */
const CAP10 = (
  readFileSync(root("livros", "um-anel", "10-rivendell.md"), "utf8").split(
    "### Virtudes dos Altos-Elfos"
  )[1] ?? ""
).split("\n## ")[0];
ok("capítulo 10 tem a seção das Virtudes dos Altos-Elfos", CAP10.length > 0);

const norm = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim();

/* Títulos de Virtude nos capítulos. O capítulo 5 escreve `**NOME**` sozinho na
   linha; o 10 escreve `**NOME** — descrição`. Os dois formatos entram. */
function virtueHeadings(md) {
  return [
    /* `[^*\n]` e não `[^*]`: sem excluir a quebra de linha, um negrito que ocupa
       duas linhas (há uma nota assim no capítulo 10) casa como se fosse título. */
    ...[...md.matchAll(/^\*\*([A-ZÀ-Ú0-9][^*\n]*)\*\*\s*$/gm)].map((m) => m[1]),
    ...[...md.matchAll(/^\*\*([A-ZÀ-Ú0-9][^*\n]*)\*\*\s+—/gm)].map((m) => m[1]),
  ].map((h) => h.trim());
}

/* Recompensas trazem o alvo entre parênteses ("CRUEL (ARMA)") — o qualificador
   não faz parte do nome, então sai antes de comparar. */
const headingsAll = [...virtueHeadings(CAP5), ...virtueHeadings(CAP10)].map((h) =>
  norm(h.replace(/\s*\([^)]*\)\s*$/, ""))
);
const headingSet = new Set(headingsAll);

const codeVirtueNames = [...CULTURAL_TS.matchAll(/name: "([^"]+)"/g)].map((m) => m[1]);
/* 6 Culturas × 6 Virtudes + 4 exclusivas dos Altos-Elfos de Valfenda. */
ok(
  "cultural-virtues.ts tem as 40 Virtudes Culturais",
  codeVirtueNames.length === 40,
  `achou ${codeVirtueNames.length}`
);

for (const name of codeVirtueNames) {
  ok(
    `"${name}" tem título igual em algum capítulo`,
    headingSet.has(norm(name)),
    "capítulo e código batizaram a mesma Virtude de formas diferentes"
  );
}

const DATA_TS = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");
function labelsOf(constName) {
  const block = DATA_TS.match(new RegExp(`${constName}[\\s\\S]*?\\n\\];`));
  return block ? [...block[0].matchAll(/label: "([^"]+)"/g)].map((m) => m[1]) : [];
}
const codeNameSet = new Set(
  [...codeVirtueNames, ...labelsOf("STARTING_VIRTUES"), ...labelsOf("STARTING_REWARDS")].map(norm)
);

for (const h of headingsAll) {
  ok(`título "${h}" existe no código`, codeNameSet.has(h), "Virtude do livro sem nome igual no app");
}

console.log(`\n  ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
