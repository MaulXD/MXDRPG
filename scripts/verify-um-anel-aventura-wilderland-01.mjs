/**
 * "Não Desvie da Trilha" — a primeira aventura de *Tales from Wilderland*,
 * convertida da 1ª para a 2ª edição.
 *
 * Por que existe: uma aventura convertida é onde a conversão pode dar errado sem
 * fazer barulho. Um nome de perícia antigo que sobrou, um NA fixo que ficou, um
 * adversário citado que não existe no bestiário — nada disso quebra build nem
 * tipo. Só quebra na mesa, com o Mestre procurando um bloco que não está lá.
 *
 * Este teste amarra três coisas:
 * 1. **toda citação CVR-xxx aponta para uma entrada que existe** na tabela de
 *    conversão — referência quebrada é pior que ausência de referência;
 * 2. **todo adversário citado existe** em `lib/character/um-anel/adversaries.ts`;
 * 3. **nenhum termo de 1ª edição sobreviveu** ao texto convertido, e os que
 *    aparecem para serem NEGADOS aparecem uma vez só, no contexto certo.
 *
 * Fonte: livros/um-anel/15-wilderland-01-nao-desvie-da-trilha.md e
 * livros/um-anel/compendio/conversao-primeira-edicao.md.
 */
import { readFileSync as rawReadFileSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const AVENTURA = readFileSync(root("livros", "um-anel", "15-wilderland-01-nao-desvie-da-trilha.md"), "utf8");
const TABELA = readFileSync(
  root("livros", "um-anel", "compendio", "conversao-primeira-edicao.md"),
  "utf8"
);
const ADVERSARIES = readFileSync(root("lib", "character", "um-anel", "adversaries.ts"), "utf8");

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

console.log("verify-um-anel-aventura-wilderland-01: a conversão fecha com a tabela e o bestiário");

/* ── 1. As citações CVR apontam para entradas reais ────────────────────── */

const citados = [...new Set([...AVENTURA.matchAll(/\bCVR-(\d{3})\b/g)].map((m) => m[0]))];
ok(
  "a aventura cita a tabela de conversão",
  citados.length >= 10,
  `citou ${citados.length} entradas — conversão sem referência é conversão sem régua`
);
for (const id of citados.sort()) {
  ok(
    `citação ${id} existe na tabela`,
    TABELA.includes(`## ${id} —`),
    "referência quebrada manda o Mestre procurar o que não existe"
  );
}

/* O contrário também importa: as entradas que ESTA aventura deveria usar. Se
   alguém apagar a citação de Malfeitoria ou da inversão das Fontes de Dano, a
   conversão perde justamente as armadilhas. */
for (const [id, porque] of [
  ["CVR-004", "Ódio × Resolução — os bandidos se rendem, e matá-los pode ser Malfeitoria"],
  ["CVR-013", "as perícias renomeadas"],
  ["CVR-016", "o NA fixo que some"],
  ["CVR-017", "a dificuldade que vira Complicação/Vantagem"],
  ["CVR-020", "a Tolerância que vira Conselho"],
  ["CVR-024", "o teste de corrupção que vira Teste de Sombra"],
  ["CVR-028", "as Fontes de Dano, lidas ao contrário"],
  ["CVR-030", "a lacuna do bloco de Aranha"],
]) {
  ok(`a aventura usa ${id} (${porque})`, AVENTURA.includes(id));
}

/* ── 2. Todo adversário citado existe no bestiário ─────────────────────── */

/* Os ids aparecem no texto entre crases — é assim que o Mestre acha o bloco. */
const idsCitados = [...new Set([...AVENTURA.matchAll(/`([a-z][a-z0-9-]{4,})`/g)].map((m) => m[1]))]
  .filter((id) => ADVERSARIES.includes(`id: "${id}"`) || /^(batedor|chefe|assaltante)/.test(id));
ok("a aventura cita ids de bloco do bestiário", idsCitados.length >= 3, `achei ${idsCitados.join(", ")}`);
for (const id of idsCitados) {
  ok(`bloco "${id}" existe em adversaries.ts`, ADVERSARIES.includes(`id: "${id}"`));
}

for (const nome of ["Salteador", "Chefe dos Rufiões", "Ladrão de Estrada"]) {
  ok(
    `adversário "${nome}" é citado pelo RÓTULO e existe no bestiário`,
    AVENTURA.includes(nome) && ADVERSARIES.includes(`name: "${nome}"`),
    "o id nunca aparece sozinho na tela — o Mestre lê o rótulo"
  );
}

/* Bandidos são Homens Maus: Resolução, não Ódio. Se o bestiário mudar isso, o
   parágrafo sobre Malfeitoria na aventura vira mentira. */
for (const id of ["batedor-de-bolsos", "chefe-arruaceiro", "assaltante-de-estrada"]) {
  const bloco = ADVERSARIES.slice(ADVERSARIES.indexOf(`id: "${id}"`), ADVERSARIES.indexOf(`id: "${id}"`) + 700);
  ok(
    `"${id}" tem Resolução, como a aventura afirma`,
    /hateKind: "resolve"/.test(bloco),
    "a aventura diz que atacá-los pode ser Malfeitoria — isso só vale para Resolução"
  );
}

/* ── 3. A Coisa do Fosso ───────────────────────────────────────────────── */

/* Os números que passam direto do bloco de 1ª edição. */
for (const [campo, valor] of [
  ["Nível de Atributo", "4"],
  ["Resistência", "45"],
  ["Vigor", "2"],
  ["Ódio", "6"],
  ["Bloqueio", "4"],
  ["Armadura", "3"],
]) {
  ok(
    `bloco da Coisa do Fosso: ${campo} = ${valor}`,
    new RegExp(`\\| ${campo} \\| ${valor} \\|`).test(AVENTURA)
  );
}

/* O Vigor é a única linha do bloco que a 1ª edição não tinha. A aventura só pode
   afirmá-lo porque o TEXTO da própria aventura diz "Ferida duas vezes" — e o
   teste exige que a justificativa esteja escrita, não subentendida. */
ok(
  "o Vigor 2 vem do texto da aventura, e a justificativa está escrita",
  /Ferida \*\*duas vezes\*\*/.test(AVENTURA) &&
    /Vigor é[\s>]*exatamente o número de Ferimentos/.test(AVENTURA),
  "sem a justificativa escrita, Vigor 2 seria estimativa disfarçada"
);
/* NEGATIVA: não pode existir fórmula de Vigor. CVR-003 registra a lacuna. */
ok(
  "a aventura NÃO inventa regra geral de Vigor",
  !/Vigor\s*=\s*/.test(AVENTURA) && !/regra de conversão de Vigor/.test(AVENTURA),
  "um caso resolvido pelo texto não vira fórmula para os outros"
);

/* Agarrar virou Dano Especial, e o bestiário tem essa opção — se o nome mudar
   lá, a aventura passa a citar algo que não existe. */
ok(
  "o Dano Especial Agarrar existe no bestiário com esse nome",
  /specialDamage: \["Agarrar"\]/.test(ADVERSARIES) && /\| Agarrar \|/.test(AVENTURA)
);
ok(
  "Grande Tamanho virou criatura grande, que o motor conhece",
  /large: true/.test(ADVERSARIES) && /criatura grande para os limites de engajamento/.test(AVENTURA)
);

/* ── 4. Nenhum termo de 1ª edição sobreviveu ───────────────────────────── */

/* Termos que não podem aparecer NUNCA — nem para explicar. */
for (const [termo, viraram] of [
  ["Fase em Sociedade", "Fase de Companhia"],
  ["Tiro Certeiro", "Dano Especial"],
  ["Called Shot", "Dano Especial"],
  ["pontos? de tesouro", "ponto de Tesouro"],
]) {
  ok(
    `termo de 1ª edição "${termo}" não sobreviveu (virou ${viraram})`,
    !new RegExp(termo).test(AVENTURA),
    "sem exceção: nem no resumo esse termo precisa aparecer"
  );
}

/* Termos que PODEM aparecer, mas só para dizer no que viraram. Banir a palavra
   inteira falharia contra o próprio resumo da conversão — a mesma armadilha do
   "Parada" na tabela. Então se fixa o CONTEXTO: toda frase que cita o termo
   antigo precisa dizer "virou" ou "original". */
for (const [termo, viraram] of [
  ["[Cc]omitiva", "Companhia"],
  ["Tolerância", "Conselho"],
  ["[Tt]este de corrup[çc][ãa]o", "Teste de Sombra"],
]) {
  const frases = [...AVENTURA.matchAll(new RegExp(`[^.\\n]*${termo}[^.\\n]*`, "g"))].map((m) => m[0]);
  const soltas = frases.filter((f) => !/virou|original/.test(f));
  ok(
    `"${termo}" só aparece dizendo que virou ${viraram}`,
    frases.length > 0 && soltas.length === 0,
    soltas.map((f) => f.trim().slice(0, 80)).join(" | ") || "nem apareceu — a conversão precisa ser dita"
  );
}
ok("e o Teste de Sombra aparece no lugar", /Teste de Sombra/.test(AVENTURA));

/* NA fixo: pode ser MENCIONADO ao explicar o que o original fazia, nunca dado
   como instrução. Mesma lição do "Parada" na tabela de conversão — banir a
   palavra falha, então se fixa o CONTEXTO: toda menção a NA numérico tem de
   estar na mesma frase que "original". */
/* Só interessa NA com NÚMERO-ALVO fixo (dois dígitos: 12, 14, 16, 18) — "o NA
   do Atributo do herói" é justamente a forma CERTA da 2ª edição e não pode ser
   acusada. */
const mencoesNA = [...AVENTURA.matchAll(/[^.\n]*\bNA\b(?: de)? \d{2}[^.\n]*/g)].map((m) => m[0]);
const semOriginal = mencoesNA.filter((f) => !/original/.test(f));
ok(
  "todo NA numérico só aparece explicando o que o ORIGINAL fazia",
  semOriginal.length === 0,
  semOriginal.map((f) => f.trim().slice(0, 90)).join(" | ")
);

/* ── 5. A lacuna das Aranhas é declarada, e nada foi inventado ─────────── */

ok(
  "a aventura declara a lacuna do bloco de Aranha",
  /## Lacunas registradas/.test(AVENTURA) && /bloco de Aranha/i.test(AVENTURA)
);
ok(
  "e continua sendo lacuna de verdade no bestiário",
  !/id: "aranha/i.test(ADVERSARIES) && !/name: "Aranha/i.test(ADVERSARIES),
  "se um bloco aparecer, esta seção da aventura precisa mudar"
);
/* NEGATIVA: a aventura NÃO pode trazer um bloco de Aranha improvisado. O único
   bloco em tabela permitido é o da Coisa do Fosso. */
const blocosEmTabela = [...AVENTURA.matchAll(/\| Nível de Atributo \| \d+ \|/g)];
ok(
  "só existe UM bloco de estatísticas na aventura — o da Coisa do Fosso",
  blocosEmTabela.length === 1,
  `achei ${blocosEmTabela.length}; um segundo bloco seria estatística inventada`
);

console.log(`\nverify-um-anel-aventura-wilderland-01: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
