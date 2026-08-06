/**
 * Verifica o bestiário do Um Anel contra o capítulo 8 — entra em `npm run test`.
 *
 * Dois achados motivaram este arquivo:
 *
 * 1. **Vigor era ignorado no combate.** O livro: "o Vigor indica o número de
 *    Ferimentos necessários para abater um inimigo de vez". O motor eliminava
 *    QUALQUER adversário no primeiro Ferimento, e o campo `might` existia nos 22
 *    blocos mas nunca era copiado para o token. Os 8 adversários de Vigor 2
 *    morriam com metade — o Grande Troll das Cavernas (Resistência 80, Proteção
 *    3d) saía do combate num único Golpe Perfurante.
 *
 * 2. **Habilidades de FAMÍLIA não propagadas.** O livro diz "todos" para cada
 *    uma, mas 7 blocos estavam sem: 3 Trolls sem Rijeza Hedionda e Cabeça-dura,
 *    os 3 Mortos-vivos sem Infundir Medo (a principal fonte de Sombra deles), e o
 *    Cão de Sauron sem Grande Salto — justamente o mais perigoso da família, o que
 *    transformava a postura de Retaguarda num esconderijo seguro contra ele.
 *
 * Fonte: livros/um-anel/08-mestre-e-adversarios.md
 */
import { readFileSync as rawReadFileSync } from "fs";

/* Normaliza CRLF -> LF: âncoras de linha não devem depender de fim de linha. */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const ADV = readFileSync(root("lib", "character", "um-anel", "adversaries.ts"), "utf8");
const BOOK = readFileSync(root("livros", "um-anel", "08-mestre-e-adversarios.md"), "utf8");
const ATTACK = readFileSync(root("lib", "combat", "um-anel", "resolve-attack.ts"), "utf8");
const VITALS = readFileSync(root("lib", "combat", "um-anel", "vitals.ts"), "utf8");
const TOKEN = readFileSync(root("lib", "character", "um-anel", "adversary-token.ts"), "utf8");
const TYPES = readFileSync(root("lib", "vtt", "types.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-combat-attack.ts"), "utf8");

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

const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/\/\/[^\n]*/g, "");

console.log("verify-um-anel-bestiario: bestiário × capítulo 8");

/* ── Vigor = nº de Ferimentos pra abater ──────────────────────────────── */

ok(
  "livro: Vigor é o nº de Ferimentos pra abater",
  /o Vigor indica o número de Ferimentos necessários para abater um inimigo de vez/i.test(BOOK)
);
ok(
  "livro: Resistência a zero retira do combate independente do Vigor",
  /Todos os adversários são retirados do combate se sua Resistência for reduzida a zero/i.test(BOOK)
);

ok("token de adversário carrega o Vigor", /might\?: number;/.test(TYPES));
ok("token de adversário conta Ferimentos", /wounds\?: number;/.test(TYPES));
ok(
  "criação do token copia o Vigor (piso 1)",
  /might: Math\.max\(1, stats\.might\)/.test(TOKEN) && /wounds: 0/.test(TOKEN)
);

const attackCode = stripComments(ATTACK);
ok("motor recebe o Vigor do defensor", /defenderMight\?: number;/.test(ATTACK));
ok("motor recebe os Ferimentos já sofridos", /defenderWounds\?: number;/.test(ATTACK));
// A REGRESSÃO: adversário eliminado por QUALQUER Ferimento.
ok(
  "adversário NÃO morre em qualquer Ferimento",
  !/dying: true, \/\/ adversários são eliminados/.test(ATTACK)
);
ok(
  "só abate quando os Ferimentos fecham o Vigor",
  /woundsAfter >= might/.test(attackCode) &&
    /woundsAfter = Math\.max\(0, params\.defenderWounds \?\? 0\) \+ 1/.test(attackCode)
);
ok(
  "handler passa Vigor e Ferimentos ao motor",
  /defenderMight: defCombat\.might/.test(HANDLER) && /defenderWounds: defCombat\.wounds/.test(HANDLER)
);
// vitals só conta e aplica — a decisão é do motor, pra não haver duas
// implementações da mesma regra divergindo depois.
const vitalsCode = stripComments(VITALS);
ok("vitals incrementa os Ferimentos do adversário", /wounds: nextWounds/.test(vitalsCode));
ok(
  "vitals decide eliminação por result.dying, não recalcula o Vigor",
  /eliminated \|\| result\.dying \|\| defeated/.test(vitalsCode) &&
    !/nextWounds >= might/.test(vitalsCode)
);

/* ── Habilidades de FAMÍLIA em todos os blocos ────────────────────────── */

/** Habilidades Sinistras por id de adversário. */
function habilidadesPorId() {
  const out = {};
  for (const parte of ADV.split(/\n  \{\n/).slice(1)) {
    const corpo = parte.split(/\n  \},/)[0];
    const id = (corpo.match(/id: "([^"]+)"/) || [])[1];
    if (!id) continue;
    out[id] = [...corpo.matchAll(/name: "([^"]+)",\s*\n?\s*text:/g)].map((m) => m[1]);
  }
  return out;
}

const HABS = habilidadesPorId();
ok("achou os blocos do bestiário", Object.keys(HABS).length >= 22, `achou ${Object.keys(HABS).length}`);

const FAMILIAS = [
  {
    nome: "Trolls",
    livro: /todos os Trolls têm em comum[\s\S]{0,400}?Rijeza Hedionda[\s\S]{0,600}?Cabeça-dura/i,
    ids: [
      "grande-troll-das-cavernas",
      "cave-troll-furtivo",
      "ladrao-troll-de-pedra",
      "chefe-troll-de-pedra",
    ],
    exigidas: ["Rijeza Hedionda", "Cabeça-dura"],
  },
  {
    nome: "Mortos-vivos",
    livro: /todas as criaturas Mortas-vivas[\s\S]{0,900}?INFUNDIR MEDO/i,
    ids: ["barrow-wight", "espectro-funesto", "habitantes-do-pantano"],
    exigidas: ["Imorredouro", "Sem Coração", "Infundir Medo"],
  },
  {
    nome: "Lobos das Terras Selvagens",
    livro: /todos os Lobos das Terras Selvagens compartilham a Habilidade Sinistra Grande Salto/i,
    ids: ["warg", "chefe-de-alcateia", "sabujo-de-sauron"],
    exigidas: ["Grande Salto"],
  },
];

for (const fam of FAMILIAS) {
  ok(`livro: ${fam.nome} têm a(s) habilidade(s) de família`, fam.livro.test(BOOK));
  for (const id of fam.ids) {
    const habs = HABS[id] || [];
    const faltam = fam.exigidas.filter((h) => !habs.includes(h));
    ok(
      `${fam.nome}: ${id} tem ${fam.exigidas.join(" + ")}`,
      faltam.length === 0,
      `falta ${faltam.join(", ")}`
    );
  }
}

/* ── Nomes de habilidade têm de existir no livro ───────────────────────
   O app mostrava "Resistência Hedionda", "Obtuso" e "Golpe de Pavor" — nomes que
   não existem em livros/um-anel/. Mesmo modo de falha do bug de "Reanimar
   Companheiros": o Mestre procura no livro pelo nome que o app exibe e não acha. */

for (const [antigo, atual] of [
  ["Resistência Hedionda", "Rijeza Hedionda"],
  ["Obtuso", "Cabeça-dura"],
  ["Golpe de Pavor", "Infundir Medo"],
]) {
  ok(`"${atual}" existe no livro`, BOOK.includes(atual));
  ok(`nome antigo "${antigo}" não voltou ao código`, !ADV.includes(`"${antigo}"`));
}

/* ── Os 8 adversários de Vigor 2 ──────────────────────────────────────── */

const vigor2 = Object.entries(HABS).length;
const comVigor2 = (ADV.match(/might: 2/g) || []).length;
ok("há adversários de Vigor 2 pra proteger", comVigor2 >= 8, `achou ${comVigor2} de ${vigor2} blocos`);
// O Grande Troll das Cavernas é o caso extremo: Resistência 80 e Vigor 2.
ok(
  "Grande Troll das Cavernas tem Resistência 80 e Vigor 2",
  /id: "grande-troll-das-cavernas"[\s\S]{0,400}?endurance: 80[\s\S]{0,200}?might: 2/.test(ADV)
);

/* ── Fase J: os 3 adversários nomeados de Eriador ──────────────────────
   Estavam traduzidos em 12-o-mundo-eriador.md e não existiam no bestiário. Os
   números vêm daquele capítulo; o `id` fica em inglês porque é chave estável
   (renomear quebraria salas salvas) e o `name` em PT-BR porque aparece no
   nameplate do token. */

const ERIADOR = readFileSync(root("livros", "um-anel", "12-o-mundo-eriador.md"), "utf8");

const NOMEADOS = [
  {
    id: "barrow-king",
    name: "Rei-Tumulário",
    attributeLevel: 9,
    endurance: 45,
    might: 2,
    hate: 9,
    parry: 0,
    armour: 4,
    // Mortos-vivos: as três de família, além das quatro do próprio bloco.
    familia: ["Imorredouro", "Sem Coração", "Infundir Medo"],
  },
  {
    id: "burzgul",
    name: "Búrzgul",
    attributeLevel: 5,
    endurance: 22,
    might: 1,
    hate: 5,
    parry: 3,
    armour: 3,
    familia: ["Odeia a Luz do Sol"],
  },
  {
    id: "ash-the-warg",
    name: "Ash",
    attributeLevel: 4,
    endurance: 20,
    might: 1,
    hate: 4,
    parry: 2,
    armour: 1,
    // Lobos das Terras Selvagens.
    familia: ["Grande Salto"],
  },
];

/** Campos numéricos do bloco daquele id. */
function blocoDe(id) {
  for (const parte of ADV.split(/\n  \{\n/).slice(1)) {
    const corpo = parte.split(/\n  \},/)[0];
    if (new RegExp(`id: "${id}"`).test(corpo)) return corpo;
  }
  return null;
}

for (const n of NOMEADOS) {
  const bloco = blocoDe(n.id);
  ok(`${n.id}: bloco existe`, Boolean(bloco));
  if (!bloco) continue;

  ok(`${n.id}: nome de exibição em PT-BR ("${n.name}")`, new RegExp(`name: "${n.name}"`).test(bloco));
  for (const [campo, valor] of [
    ["attributeLevel", n.attributeLevel],
    ["endurance", n.endurance],
    ["might", n.might],
    ["hate", n.hate],
    ["parry", n.parry],
    ["armour", n.armour],
  ]) {
    ok(
      `${n.id}: ${campo} = ${valor}`,
      new RegExp(`${campo}: ${valor},`).test(bloco),
      bloco.match(new RegExp(`${campo}: (\\d+)`))?.[1]
    );
  }
  const habs = [...bloco.matchAll(/name: "([^"]+)",\s*\n?\s*text:/g)].map((m) => m[1]);
  const faltam = n.familia.filter((h) => !habs.includes(h));
  ok(`${n.id}: habilidades de família (${n.familia.join(" + ")})`, faltam.length === 0, faltam.join(", "));

  // Os números têm de vir do capítulo, não de invenção.
  ok(
    `${n.id}: Resistência ${n.endurance} confere com o livro`,
    new RegExp(`Resistência:\\*\\* ${n.endurance} `).test(ERIADOR)
  );
}

// O Bloqueio do Rei-Tumulário é "–" no livro (sem escudo nem esquiva) → 0.
ok(
  'livro: Rei-Tumulário tem Bloqueio "–"',
  /Rei-Tumulário[\s\S]{0,600}?\*\*Bloqueio:\*\* –/.test(ERIADOR)
);

// "Sobrepujar" fica como texto de Dano Especial: o efeito de Overbear não está
// definido em nenhum ponto do material, então não foi mecanizado por chute.
ok(
  "Sobrepujar do Búrzgul fica só como texto de Dano Especial",
  /specialDamage: \[[^\]]*"Sobrepujar"/.test(blocoDe("burzgul") || "")
);
ok(
  "markdown registra que Overbear não tem efeito definido na fonte",
  /Overbear\*? no original[\s\S]{0,400}?sem\s*\n?>?\s*definição na fonte/i.test(
    ERIADOR.replace(/\n>\s*/g, " ")
  )
);

/* ── Política de nomenclatura: nome exibido = nome do livro ────────────────
   A auditoria campo a campo dos 21 blocos achou 37 divergências, quase todas de
   NOME: Habilidade Sinistra, nome de exibição do adversário e Traço. O efeito
   mecânico estava certo em praticamente todas — o problema é o Mestre procurar no
   livro pelo nome que o app mostra e não encontrar. Mesmo modo de falha já
   corrigido em "Reanimar Companheiros" e em Rijeza Hedionda / Cabeça-dura.

   Regra decidida, e é ela que este bloco tranca:
   - Habilidade Sinistra e nome de exibição: vence o LIVRO.
   - Traço: vence o rótulo canônico de `data.ts` quando ele existe; senão, o livro.
     "Precavido" e "Sombrio" não existiam em data.ts (o canônico é Cauteloso e
     Severo, que é o que o livro usa) — o código era o outlier. Já "Veloz" e
     "Cruel" SÃO canônicos e o livro difere ("Rápido", "Vicioso"): ali o código
     fica, e a divergência é do livro. */

const DATA_TS = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");

/** Nomes trocados nesta rodada: [antigo no código, novo (do livro)]. */
const RENOMEADOS = [
  ["Morador das Trevas", "Habitante das Trevas"],
  ["Moradora das Trevas", "Habitante das Trevas"],
  ["Sem Morte", "Imorredouro"],
  ["Força Terrível", "Força Horrenda"],
  ["Pele Grossa", "Couro Grosso"],
  ["Ódio (Anões)", "Ódio Mortal (Anões)"],
  ["Povo Feroz", "Gente Feroz"],
  ["Veneno Orc", "Veneno de Orc"],
];

for (const [antigo, novo] of RENOMEADOS) {
  // O capítulo 8 grafa nomes de habilidade de FAMÍLIA em caixa alta
  // (IMORREDOURO, RIJEZA HEDIONDA); os de bloco vêm em caixa normal. Comparação
  // insensível a caixa cobre os dois.
  ok(
    `Habilidade "${novo}" existe no livro`,
    BOOK.toLowerCase().includes(novo.toLowerCase())
  );
  ok(`nome antigo "${antigo}" não voltou`, !ADV.includes(`"${antigo}"`));
}

/** Nome de exibição de adversário: tem de ser o do livro. */
const NOMES_DO_LIVRO = [
  ["invasor-do-sul", "Saqueador Sulista"],
  ["campeao-do-sul", "Campeão Sulista"],
  ["batedor-de-bolsos", "Salteador"],
  ["chefe-arruaceiro", "Chefe dos Rufiões"],
  ["assaltante-de-estrada", "Ladrão de Estrada"],
  ["sabujo-de-sauron", "Cão de Sauron"],
  ["chefe-de-alcateia", "Chefe dos Lobos"],
];

for (const [id, nome] of NOMES_DO_LIVRO) {
  const bloco = blocoDe(id);
  ok(`${id}: nome de exibição "${nome}"`, bloco !== null && bloco.includes(`name: "${nome}"`));
  ok(`${id}: nome está no livro`, BOOK.includes(nome));
  // O id fica em inglês/estável — renomear quebraria salas salvas.
  ok(`${id}: id preservado`, ADV.includes(`id: "${id}"`));
}

/** Traço: canônico de data.ts quando existe, senão o do livro. */
const TRACOS = [
  // Código era o outlier: o livro e data.ts concordam.
  ["Cauteloso", true, "Precavido"],
  ["Severo", true, "Sombrio"],
  ["Brutamontes", false, "Brutal"],
  ["Irritável", false, "Irritadiço"],
];

for (const [novo, canonico, antigo] of TRACOS) {
  ok(`traço "${novo}" está no livro`, BOOK.includes(novo));
  if (canonico) {
    ok(`traço "${novo}" é rótulo canônico de data.ts`, DATA_TS.includes(`label: "${novo}"`));
  }
  ok(`traço antigo "${antigo}" não voltou`, !ADV.includes(antigo));
}

// Onde o CÓDIGO é o canônico e o livro difere, o código fica. Se alguém
// "corrigir" pro livro, isto acusa e força a discussão em vez do churn.
for (const canon of ["Veloz", "Cruel"]) {
  ok(`"${canon}" é canônico em data.ts`, DATA_TS.includes(`label: "${canon}"`));
  ok(`"${canon}" preservado no bestiário`, ADV.includes(canon));
}

/* ── Cláusula de família dos Mortos-vivos ──────────────────────────────────
   Imorredouro é ineficaz contra arma mágica encantada pra Perdição dos
   Mortos-Vivos — a única contrapartida dos jogadores contra a ressurreição.
   Faltava em 2 dos 3 blocos da família. */

for (const id of ["barrow-wight", "espectro-funesto", "habitantes-do-pantano", "barrow-king"]) {
  const bloco = blocoDe(id) || "";
  const texto = bloco.match(/name: "Imorredouro",[\s\S]{0,80}?text:\s*"([^"]+)"/);
  ok(`${id}: Imorredouro presente`, Boolean(texto));
  ok(
    `${id}: Imorredouro cita a exceção da arma mágica`,
    Boolean(texto) && /[Ii]neficaz contra/.test(texto[1]),
    texto?.[1]?.slice(0, 60)
  );
}
ok(
  "livro: Imorredouro é ineficaz contra arma mágica dos Mortos-vivos",
  /IMORREDOURO[\s\S]{0,500}?ineficaz contra heróis-jogadores que empunhem uma arma mágica/i.test(BOOK)
);

// Elwen combina Imorredouro com a imunidade a Intimidar Inimigo no mesmo texto
// (não tem "Sem Coração" separado). Um patch em massa já apagou essa cláusula
// dela uma vez — esta asserção existe pra não acontecer de novo.
const elwen = blocoDe("elwen-a-espectra-funesta") || "";
ok(
  "Elwen mantém a imunidade a Intimidar Inimigo no Imorredouro",
  /name: "Imorredouro",[\s\S]{0,80}?text:\s*"[^"]*Intimidar Inimigo/.test(elwen)
);

/* ── Textos corrigidos que mudam o que acontece na mesa ───────────────── */

ok(
  "Cabeça-dura cobra a ação principal da rodada",
  /Cabeça-dura[\s\S]{0,200}?como ação principal da rodada/.test(ADV)
);
ok(
  "Ferida Mortal desfavorece a ROLAGEM, não a Ferida",
  /Alvos Feridos fazem uma rolagem Desfavorecida de Dado de Proeza/.test(ADV)
);
ok(
  "Espectro Funesto usa Lâmina Corroída (nome do livro)",
  (blocoDe("espectro-funesto") || "").includes('label: "Lâmina Corroída"')
);
ok(
  "Grito de Triunfo do Chefe dos Rufiões cita a família certa",
  /a todos os outros Rufiões na luta/.test(ADV) && !/outros Arruaceiros na luta/.test(ADV)
);
// Checa só o campo `description`: "Cave-troll" ainda aparece num COMENTÁRIO que
// documenta o estado antigo, e comentário não é texto exibido ao Mestre.
const descFurtivo = (blocoDe("cave-troll-furtivo") || "").match(/description:\s*"([^"]+)"/);
ok("descrição do Troll das Cavernas Furtivo existe", Boolean(descFurtivo));
ok(
  "descrição do Troll das Cavernas Furtivo sem inglês residual",
  Boolean(descFurtivo) && !/Cave-troll/.test(descFurtivo[1]),
  descFurtivo?.[1]?.slice(0, 60)
);

/* ── Fase J: aventuras do Starter Set (D31) ────────────────────────────────
   `TOR_Starter_Set_The_Adventures.pdf` é 2ª EDIÇÃO — compatível direto com o
   motor, sem conversão. As outras duas aventuras do acervo (*Tales from
   Wilderland* e *The Darkening of Mirkwood*) são de 1ª edição e exigiriam
   converter estatísticas, NAs e Sombra; por isso esta veio primeiro.

   Três blocos de adversário novos saíram daqui. Os blocos das aventuras são
   SIMPLIFICADOS: não trazem Vigor, Ódio/Resolução nem Traços. Vigor ausente = 1
   (o padrão do motor) e o Ódio foi derivado do Nível de Atributo, que é a
   convenção do livro nos blocos completos. */

const AVENTURAS = readFileSync(root("livros", "um-anel", "14-aventuras-starter-set.md"), "utf8");

ok(
  "capítulo das aventuras existe e está em PT-BR",
  AVENTURAS.length > 20000 &&
    (AVENTURAS.match(/\b(de|que|para|com|não|uma)\b/gi) || []).length > 400
);
ok(
  "registra que é 2ª edição, compatível direto",
  /2ª EDIÇÃO — compatível direto com o motor/.test(AVENTURAS)
);
ok(
  "registra por que não veio de 1ª edição",
  /1ª edição[\s\S]{0,200}?convers[ãa]o de estat[íi]sticas/i.test(AVENTURAS)
);

// As cinco aventuras, com a ordem encadeada que a introdução define.
const CINCO = [
  "Uma Conspiração das Mais Rachadas",
  "Caçadores de Tesouro Experientes",
  "Fogos de Artifício Mais Excelentes",
  "Carteiros Involuntários",
  "Para Acalmar uma Fera Selvagem",
];
for (const t of CINCO) {
  ok(`aventura "${t}" presente`, AVENTURAS.includes(t));
}
ok(
  "ordem encadeada registrada (Conspiração primeiro, Fera Selvagem final)",
  /Uma Conspiração das Mais Rachadas\*? primeiro[\s\S]{0,200}?Para Acalmar uma Fera Selvagem\*? como final/.test(
    AVENTURAS
  )
);

// A divergência da fonte: o livro de aventuras diz NOVE pré-gerados, o livreto
// de fichas traz OITO. Registrada, não corrigida por chute.
ok(
  "divergência dos 9 vs 8 pré-gerados registrada",
  /diz \*\*nove\*\* pré-gerados[\s\S]{0,300}?\*\*oito\*\* blocos/.test(AVENTURAS)
);

/* ── Os 3 adversários das aventuras ────────────────────────────────────── */

const DAS_AVENTURAS = [
  {
    id: "jack-the-stone-troll",
    name: "Jack, o Troll de Pedra",
    attributeLevel: 8,
    endurance: 34,
    parry: 1,
    armour: 3,
    // Trolls: as duas de família.
    familia: ["Rijeza Hedionda", "Cabeça-dura"],
  },
  {
    id: "orc-veteran",
    name: "Veterano Orc",
    attributeLevel: 4,
    endurance: 16,
    parry: 2,
    armour: 3,
    familia: ["Odeia a Luz do Sol"],
  },
  {
    id: "burnt-beast",
    name: "Fera Queimada",
    attributeLevel: 5,
    endurance: 20,
    parry: 2,
    armour: 3,
    familia: ["Grande Salto", "Habitante das Trevas"],
  },
];

for (const a of DAS_AVENTURAS) {
  const bloco = blocoDe(a.id);
  ok(`${a.id}: bloco existe`, Boolean(bloco));
  if (!bloco) continue;
  ok(`${a.id}: nome em PT-BR ("${a.name}")`, bloco.includes(`name: "${a.name}"`));
  for (const [campo, valor] of [
    ["attributeLevel", a.attributeLevel],
    ["endurance", a.endurance],
    ["parry", a.parry],
    ["armour", a.armour],
  ]) {
    ok(`${a.id}: ${campo} = ${valor}`, new RegExp(`${campo}: ${valor},`).test(bloco));
  }
  // Vigor ausente na fonte vira 1 — não pode virar 2 por chute.
  ok(`${a.id}: Vigor 1 (ausente na fonte simplificada)`, /might: 1,/.test(bloco));
  const habs = [...bloco.matchAll(/name: "([^"]+)",\s*\n?\s*text:/g)].map((m) => m[1]);
  const faltam = a.familia.filter((h) => !habs.includes(h));
  ok(`${a.id}: habilidades de família (${a.familia.join(" + ")})`, faltam.length === 0, faltam.join(", "));
  // Os números têm de vir do capítulo, não de invenção.
  ok(
    `${a.id}: Resistência ${a.endurance} confere com o capítulo`,
    new RegExp(`\\| Resistência \\| ${a.endurance} \\|`).test(AVENTURAS)
  );
}

// A Fera Queimada aparece em PAR — o Mestre precisa saber que usa o mesmo bloco duas vezes.
ok(
  "capítulo avisa que a Fera Queimada aparece em par",
  /aparecem em PAR|par\*\* e não uma criatura única/.test(AVENTURAS)
);
// E que arma comum não a mata de vez.
ok(
  "capítulo registra que morte por arma comum não é permanente",
  /sua morte não é permanente[\s\S]{0,200}?Oesternesse/.test(AVENTURAS)
);

console.log(`\nverify-um-anel-bestiario: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
