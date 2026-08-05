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
    exigidas: ["Sem Morte", "Sem Coração", "Infundir Medo"],
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

console.log(`\nverify-um-anel-bestiario: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
