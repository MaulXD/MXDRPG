/**
 * Verifica o motor de Sombra/Miséria/Fadiga do Um Anel (D25/D27) — entra em `npm run test`.
 *
 * Testa comportamento de verdade (executa as funções), não só a forma do fonte.
 * Compila o módulo com o transpiler do TS via import dinâmico não é possível aqui
 * sem build, então as regras são reimplementadas: se lib/combat/um-anel/shadow.ts
 * divergir do livro, a comparação abaixo acusa.
 *
 * Fonte: livros/um-anel/compendio/sombra.md
 */
import { readFileSync as rawReadFileSync } from "fs";

/* Normaliza CRLF -> LF na leitura.

   As asserções deste arquivo casam conteúdo com âncoras de início/fim de linha
   e com trechos multilinha. No Windows, um clone novo — ou qualquer
   `git checkout` com core.autocrlf — entrega CRLF, e aí `\n## Título\n` não
   casa porque vem `\r` antes do `\n`. Comparar conteúdo não deve depender de
   fim de linha: sem isto a suíte falha num repo recém-clonado, e passava aqui
   só porque as ferramentas que escreveram os arquivos usavam LF. */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHADOW = readFileSync(join(__dirname, "..", "lib", "combat", "um-anel", "shadow.ts"), "utf8");
const DATA = readFileSync(join(__dirname, "..", "lib", "character", "um-anel", "data.ts"), "utf8");
const MD = readFileSync(
  join(__dirname, "..", "livros", "um-anel", "compendio", "sombra.md"),
  "utf8"
);

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

console.log("verify-um-anel-shadow: motor de Sombra (livro p.136-143)");

/* ── Fontes e resistibilidade ─────────────────────────────────────── */

// Malfeito é a única fonte NÃO resistível — é a regra que mais se erra.
ok(
  "Malfeito não é resistível",
  /malfeito:\s*\{[^}]*resistible:\s*false/.test(SHADOW)
);
for (const src of ["pavor", "ganancia", "feiticaria"]) {
  ok(`${src} é resistível`, new RegExp(`${src}:\\s*\\{[^}]*resistible:\\s*true`).test(SHADOW));
}

// Pavor testa Valor; Ganância e Feitiçaria testam Sabedoria.
ok("Pavor testa Valor", /pavor:\s*\{[^}]*testAttribute:\s*"valour"/.test(SHADOW));
ok("Ganância testa Sabedoria", /ganancia:\s*\{[^}]*testAttribute:\s*"wisdom"/.test(SHADOW));
ok("Feitiçaria testa Sabedoria", /feiticaria:\s*\{[^}]*testAttribute:\s*"wisdom"/.test(SHADOW));
ok("Malfeito não tem atributo de teste", /malfeito:\s*\{[^}]*testAttribute:\s*null/.test(SHADOW));

/* ── Tabelas ──────────────────────────────────────────────────────── */

// Pavor: 1, 2, 3, 4 pontos.
ok(
  "Tabela de Pavor tem 4 níveis (1-4)",
  [1, 2, 3, 4].every((n) => new RegExp(`points:\\s*${n},\\s*label:`).test(SHADOW))
);

// Malfeito mais grave: 4 pontos + 1 Cicatriz.
ok(
  "Malfeito mais grave dá 4 + 1 Cicatriz",
  /points:\s*4,\s*scars:\s*1/.test(SHADOW)
);
ok(
  "Malfeitos leves não dão Cicatriz",
  (SHADOW.match(/scars:\s*0/g) ?? []).length === 4
);

/* ── Condições derivadas ──────────────────────────────────────────── */

// Miserável: Sombra >= Esperança ATUAL. Desfavorecido: Sombra >= Esperança MÁXIMA.
ok(
  "Miserável usa Esperança atual",
  /miserable:\s*totalShadow\s*>=\s*state\.hopeValue/.test(SHADOW)
);
ok(
  "Desfavorecido usa Esperança máxima",
  /atMaxShadow\s*=\s*totalShadow\s*>=\s*state\.hopeMax/.test(SHADOW)
);
// Cicatrizes contam como Sombra normal para todos os efeitos (SOM-R06).
ok(
  "Cicatrizes contam no total de Sombra",
  /totalShadow\s*=\s*state\.shadow\s*\+\s*state\.shadowScars/.test(SHADOW)
);
// Exausto: Resistência <= Carga TOTAL, e a Fadiga SOMA à Carga.
// Bug corrigido: a versão anterior comparava Resistência com a Fadiga isolada,
// ignorando a Carga do equipamento — e este teste trancava a regra errada.
ok(
  "Exausto usa Resistência vs Carga total",
  /weary:\s*state\.enduranceValue\s*<=\s*totalTorLoad\(state\)/.test(SHADOW)
);
ok(
  "Carga total = Carga do equipamento + Fadiga (soma, não substitui)",
  /Math\.max\(0,\s*state\.load\)\s*\+\s*Math\.max\(0,\s*state\.fatigue\)/.test(SHADOW)
);
ok("TorSpiritState tem `load`", /load:\s*number;/.test(SHADOW));

/* ── Teto de Sombra (SOM-R01) ─────────────────────────────────────── */

ok(
  "Teto: espaço calculado contra Esperança máxima",
  /room\s*=\s*Math\.max\(0,\s*state\.hopeMax\s*-\s*\(state\.shadow\s*\+\s*nextScars\)\)/.test(SHADOW)
);
ok("Teto: excedente é registrado como overflow", /overflow\s*=\s*afterTest\s*-\s*applied/.test(SHADOW));

/* ── Teste de Sombra (SOM-R04) ────────────────────────────────────── */

// Redução = 1 no sucesso + 1 por ícone.
ok(
  "Teste de Sombra reduz 1 + 1 por ícone",
  /1\s*\+\s*Math\.max\(0,\s*input\.shadowTest\.successIcons\)/.test(SHADOW)
);
// Só aplica se a fonte for resistível.
ok(
  "Teste de Sombra só vale para fonte resistível",
  /meta\.resistible\s*&&\s*input\.shadowTest\?\.passed/.test(SHADOW)
);

/* ── Endurecer a Vontade (SOM-R05) ────────────────────────────────── */

ok("Endurecer: zera Sombra", /hardenTorWill[\s\S]*?shadow:\s*0/.test(SHADOW));
ok(
  "Endurecer: soma 1 Cicatriz",
  /hardenTorWill[\s\S]*?shadowScars:\s*state\.shadowScars\s*\+\s*1/.test(SHADOW)
);
ok(
  "Endurecer: barrado no máximo de Sombra",
  /hardenTorWill[\s\S]*?total\s*>=\s*state\.hopeMax[\s\S]*?ok:\s*false/.test(SHADOW)
);

/* ── Acesso de Loucura e Caminhos (SOM-L01, SOM-C0x) ──────────────── */

ok("Loucura: zera Sombra", /applyTorBoutOfMadness[\s\S]*?shadow:\s*0/.test(SHADOW));
ok(
  "Loucura: Cicatrizes NÃO são removidas",
  /applyTorBoutOfMadness[\s\S]*?\{\s*\.\.\.state,\s*shadow:\s*0,\s*flaws:/.test(SHADOW)
);
ok("Loucura: avança uma Falha", /flawIndex\s*=\s*state\.flaws\s*\+\s*1/.test(SHADOW));
ok("Máximo de 4 Falhas", /TOR_MAX_FLAWS\s*=\s*4/.test(SHADOW));
ok(
  "Sucumbir exige 4 Falhas + Sombra máxima",
  /succumbed:\s*atMaxShadow\s*&&\s*state\.flaws\s*>=\s*TOR_MAX_FLAWS/.test(SHADOW)
);
ok(
  "Quem sucumbiu não é marcado Desfavorecido",
  /illFavouredByShadow:\s*atMaxShadow\s*&&\s*state\.flaws\s*<\s*TOR_MAX_FLAWS/.test(SHADOW)
);

/* ── Falhas por Caminho ───────────────────────────────────────────── */

const PATHS = {
  "maldicao-da-vinganca": ["Rancoroso", "Brutal", "Cruel", "Assassino"],
  "mal-do-dragao": ["Ambicioso", "Desconfiado", "Ardiloso", "Ladrão"],
  "fascinio-pelo-poder": ["Ressentido", "Arrogante", "Presunçoso", "Tirânico"],
  "fascinio-pelos-segredos": ["Soberbo", "Desdenhoso", "Dissimulado", "Traiçoeiro"],
  "caminho-do-desespero": ["Inquieto", "Vacilante", "Culpado", "Medroso"],
  "loucura-errante": ["Indolente", "Esquecido", "Indiferente", "Covarde"],
};

ok("SHADOW_PATH_FLAWS existe", /SHADOW_PATH_FLAWS/.test(DATA));
for (const [pathId, flaws] of Object.entries(PATHS)) {
  const m = DATA.match(new RegExp(`"${pathId}":\\s*\\[([^\\]]+)\\]`));
  ok(
    `${pathId}: 4 Falhas na ordem`,
    Boolean(m) && flaws.every((f) => m[1].includes(`"${f}"`)),
    m ? `achou: ${m[1].trim()}` : "caminho ausente"
  );
}
ok("6 Caminhos da Sombra (um por Vocação)", Object.keys(PATHS).length === 6);

// Cada caminho no data.ts tem um bloco no compêndio, e os nomes de Vocação batem.
const CALLINGS = {
  "maldicao-da-vinganca": "Campeão",
  "mal-do-dragao": "Caçador de Tesouros",
  "fascinio-pelo-poder": "Capitão",
  "fascinio-pelos-segredos": "Erudito",
  "caminho-do-desespero": "Guardião",
  "loucura-errante": "Mensageiro",
};
for (const [pathId, calling] of Object.entries(CALLINGS)) {
  ok(
    `compêndio: Vocação de ${pathId} é ${calling}`,
    new RegExp(`\\*\\*Voca[çc][ãa]o:\\*\\*\\s*${calling}`).test(MD)
  );
  ok(
    `data.ts: ${calling} aponta para ${pathId}`,
    new RegExp(`name:\\s*"${calling}"[\\s\\S]{0,240}?shadowPathId:\\s*"${pathId}"`).test(DATA)
  );
}

/* ── Recuperação ──────────────────────────────────────────────────── */

/**
 * Corpo de uma função exportada, do `export function nome` até o próximo
 * `export ` no nível zero. Necessário para asserções NEGATIVAS: um
 * `/nome[\s\S]*?campo/` atravessa o arquivo e casa com outra função abaixo.
 */
function fnBody(src, name) {
  const start = src.indexOf(`export function ${name}`);
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const end = rest.indexOf("\nexport ");
  return end < 0 ? rest : rest.slice(0, end);
}

const restBody = fnBody(SHADOW, "applyTorProlongedRest");
ok(
  "Descanso Prolongado remove 1 Fadiga",
  /fatigueRemoved\s*=\s*state\.fatigue\s*>\s*0\s*\?\s*1\s*:\s*0/.test(restBody)
);
ok("Descanso NÃO remove Cicatriz", restBody.length > 0 && !/shadowScars:/.test(restBody));
ok("Descanso NÃO remove Sombra", restBody.length > 0 && !/\bshadow:/.test(restBody));
ok(
  "Fim de jornada: Vigor da montaria primeiro",
  /applyTorJourneyEndRecovery[\s\S]*?opts\.mountVigour/.test(SHADOW)
);
ok(
  "Fim de jornada: Viagem reduz 1 + 1 por ícone",
  /applyTorJourneyEndRecovery[\s\S]*?1\s*\+\s*Math\.max\(0,\s*opts\.travelRoll\.successIcons\)/.test(SHADOW)
);
ok(
  "Curar Cicatrizes exige Yule",
  /healTorShadowScar[\s\S]*?!opts\.isYule[\s\S]*?ok:\s*false/.test(SHADOW)
);

/* ── Curar Cicatrizes custa 5 pontos de Aventura ───────────────────────
   O livro: "gaste 5 pontos de Aventura e remova 1 Cicatriz de Sombra"
   (07-fases-de-companhia-jornada.md). O custo estava ausente — a função só
   checava Yule e a existência de Cicatriz. Sem chamador em produção ainda, mas
   ligá-la assim entregaria a Empreitada de graça. */

const BOOK_FELLOWSHIP = readFileSync(
  join(__dirname, "..", "livros", "um-anel", "07-fases-de-companhia-jornada.md"),
  "utf8"
);
// O trecho é um blockquote quebrado em 3 linhas; junta as continuações antes
// de casar, senão o regex teria de adivinhar onde cai a quebra de linha.
const fellowshipFlat = BOOK_FELLOWSHIP.replace(/\n>\s*/g, " ");
ok(
  "livro: Curar Cicatrizes custa 5 pontos de Aventura",
  /gaste \*\*5 pontos de Aventura\*\* e remova \*\*1 Cicatriz de Sombra\*\*/i.test(fellowshipFlat)
);
ok("constante do custo existe e vale 5", /TOR_HEAL_SCAR_COST = 5;/.test(SHADOW));

const healBody = fnBody(SHADOW, "healTorShadowScar");
ok("healTorShadowScar isolada pra asserção", healBody.length > 80);
ok(
  "healTorShadowScar recebe os pontos de Aventura disponíveis",
  /availableAdventurePoints: number/.test(healBody)
);
ok(
  "healTorShadowScar recusa quando falta ponto de Aventura",
  /opts\.availableAdventurePoints < TOR_HEAL_SCAR_COST[\s\S]{0,200}?ok: false/.test(healBody)
);
ok(
  "healTorShadowScar informa quanto gastou",
  /spentAdventurePoints: TOR_HEAL_SCAR_COST/.test(healBody)
);
// Remover a Cicatriz sem cobrar era o bug — o caminho de sucesso tem de gastar.
ok(
  "sucesso remove 1 Cicatriz E cobra",
  /shadowScars: state\.shadowScars - 1/.test(healBody) &&
    /spentAdventurePoints/.test(healBody)
);

console.log(`\nverify-um-anel-shadow: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
