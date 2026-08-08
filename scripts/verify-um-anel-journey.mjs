/**
 * Verifica o motor de Jornada do Um Anel (D21/D23/D24) — entra em `npm run test`.
 *
 * Fonte: livros/um-anel/compendio/jornada.md
 *
 * O caso mais importante aqui é a Runa de Gandalf: em dice.ts ela tem
 * `numeric: 10`, igual ao 10 numérico, mas na tabela de eventos são resultados
 * diferentes. Se alguém reordenar as checagens, os testes de "Runa" quebram.
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
const SRC = readFileSync(join(__dirname, "..", "lib", "combat", "um-anel", "journey.ts"), "utf8");
const DATA = readFileSync(join(__dirname, "..", "lib", "character", "um-anel", "data.ts"), "utf8");
const MD = readFileSync(
  join(__dirname, "..", "livros", "um-anel", "compendio", "jornada.md"),
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

/** Corpo de uma função exportada — necessário para asserções negativas. */
function fnBody(src, name) {
  const start = src.indexOf(`export function ${name}`);
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const end = rest.indexOf("\nexport ");
  return end < 0 ? rest : rest.slice(0, end);
}

console.log("verify-um-anel-journey: motor de Jornada (livro p.111-116)");

/* ── Papéis (JOR-P0x) ─────────────────────────────────────────────── */

const ROLES = {
  guia: ["Guia", "viajar", true],
  batedor: ["Batedor", "explorar", false],
  olheiro: ["Olheiro", "percepcao", false],
  cacador: ["Caçador", "caca", false],
};

for (const [id, [label, skill, unique]] of Object.entries(ROLES)) {
  ok(
    `${label}: perícia ${skill}`,
    new RegExp(`${id}:\\s*\\{[^}]*skillId:\\s*"${skill}"`).test(SRC)
  );
  ok(
    `${label}: unique=${unique}`,
    new RegExp(`${id}:\\s*\\{[^}]*unique:\\s*${unique}`).test(SRC)
  );
  // A perícia tem de existir de verdade no sistema.
  ok(`perícia "${skill}" existe em data.ts`, new RegExp(`id:\\s*"${skill}"`).test(DATA));
}

ok("Só o Guia é único", (SRC.match(/unique:\s*true/g) ?? []).length === 1);

/* ── Teste de Marcha (JOR-S02) ────────────────────────────────────── */

// Sucesso: 3 trechos + 1 por ícone.
ok(
  "Marcha com sucesso: 3 + ícones",
  /3\s*\+\s*Math\.max\(0,\s*input\.successIcons\)/.test(SRC)
);
// Falha: 1 trecho em estação fria, 2 nas outras.
ok("Marcha falha em estação fria: 1 trecho", /isColdSeason\(input\.season\)\s*\?\s*1/.test(SRC));
ok(
  "Estação fria é Outono e Inverno",
  /season\s*===\s*"outono"\s*\|\|\s*season\s*===\s*"inverno"/.test(SRC)
);
ok(
  "Chegada quando distância >= trechos restantes",
  /arrived\s*=\s*distance\s*>=\s*input\.trechosRemaining/.test(SRC)
);

/* ── Alvo do evento (JOR-A0x) ─────────────────────────────────────── */

// 1-2 Batedor, 3-4 Olheiro, 5-6 Caçador.
ok(
  "Alvo: 1-2 Batedor, 3-4 Olheiro, 5-6 Caçador",
  /successDie\s*<=\s*2\s*\?\s*"batedor"\s*:\s*successDie\s*<=\s*4\s*\?\s*"olheiro"\s*:\s*"cacador"/.test(
    SRC
  )
);
// O Guia nunca é alvo — é quem rola o Teste de Marcha.
const targetBody = fnBody(SRC, "torEventTargetFromRoll");
ok("Guia nunca é alvo de evento", targetBody.length > 0 && !/"guia"/.test(targetBody));

/* ── Região (JOR-R0x) ─────────────────────────────────────────────── */

ok("Fronteiriças: Favorecido", /fronteirica:\s*\{[^}]*featRoll:\s*"favoured"/.test(SRC));
ok("Selvagens: normal", /selvagem:\s*\{[^}]*featRoll:\s*"normal"/.test(SRC));
ok("Sombrias: Desfavorecido", /sombria:\s*\{[^}]*featRoll:\s*"illFavoured"/.test(SRC));

/* ── Terreno (JOR-M01) ────────────────────────────────────────────── */

// Estas duas asserções trancavam a REGRA ERRADA: exigiam que o terreno virasse
// Favorecida/Desfavorecida, quando o livro dá Dado de Sucesso. Um teste que fixa
// a regra errada é pior que nenhum — ele defende o bug. A verificação correta
// está no bloco "Terreno mexe em Dados de SUCESSO" no fim deste arquivo.
ok("Estrada dá +1 Dado de Sucesso", /"estrada"\) return \{ rankDelta: 1 \}/.test(SRC));
ok("Terreno difícil dá -1 Dado de Sucesso", /"dificil"\) return \{ rankDelta: -1 \}/.test(SRC));

/* ── Tabela de Eventos (JOR-E0x) ──────────────────────────────────── */

const EVENTS = {
  "terrivel-infortunio": { fatigue: 3, triggersOn: "failure" },
  desespero: { fatigue: 2, triggersOn: "failure" },
  "mas-escolhas": { fatigue: 2, triggersOn: "failure" },
  contratempo: { fatigue: 2, triggersOn: "failure" },
  atalho: { fatigue: 1, triggersOn: "success" },
  "encontro-fortuito": { fatigue: 1, triggersOn: "success" },
  "visao-alegre": { fatigue: 0, triggersOn: "success" },
};

for (const [id, { fatigue, triggersOn }] of Object.entries(EVENTS)) {
  const key = id.includes("-") ? `"${id}"` : id;
  ok(
    `${id}: ${fatigue} Fadiga`,
    new RegExp(`${key}:\\s*\\{[\\s\\S]{0,200}?fatigue:\\s*${fatigue}`).test(SRC)
  );
  ok(
    `${id}: dispara em ${triggersOn}`,
    new RegExp(`${key}:\\s*\\{[\\s\\S]{0,240}?triggersOn:\\s*"${triggersOn}"`).test(SRC)
  );
}

ok("7 eventos na tabela", Object.keys(EVENTS).length === 7);

/* ── A ARMADILHA: Runa de Gandalf vs 10 numérico ──────────────────── */

const eventFromDie = fnBody(SRC, "torJourneyEventFromFeatDie");

ok("Olho → Terrível Infortúnio", /kind\s*===\s*"eye"[\s\S]*?terrivel-infortunio/.test(eventFromDie));
ok("Runa → Visão Alegre", /kind\s*===\s*"gandalf"[\s\S]*?visao-alegre/.test(eventFromDie));

// A checagem de `kind` PRECISA vir antes de qualquer comparação numérica,
// senão a Runa (numeric 10) cai no Encontro Fortuito.
const gandalfIdx = eventFromDie.indexOf('kind === "gandalf"');
const numericIdx = eventFromDie.search(/featDie\.numeric|\bn\s*<=/);
ok(
  "kind é checado ANTES de numeric (Runa não cai em Encontro Fortuito)",
  gandalfIdx >= 0 && numericIdx >= 0 && gandalfIdx < numericIdx,
  `gandalf@${gandalfIdx} numeric@${numericIdx}`
);

// Faixas numéricas: 1 / 2-3 / 4-7 / 8-9 / 10.
ok("1 → Desespero", /n\s*<=\s*1\)\s*return[^;]*desespero/.test(eventFromDie));
ok("2-3 → Más Escolhas", /n\s*<=\s*3\)\s*return[^;]*mas-escolhas/.test(eventFromDie));
ok("4-7 → Contratempo", /n\s*<=\s*7\)\s*return[^;]*contratempo/.test(eventFromDie));
ok("8-9 → Atalho", /n\s*<=\s*9\)\s*return[^;]*atalho/.test(eventFromDie));
ok("10 → Encontro Fortuito", /encontro-fortuito/.test(eventFromDie));

/* ── Consequências ────────────────────────────────────────────────── */

ok("Encontro Fortuito cancela a Fadiga", /cancelsFatigue/.test(SRC));
ok("Contratempo: +1 dia e +1 Fadiga no alvo", /contratempo[\s\S]{0,120}?triggered\s*\?\s*1/.test(SRC));
ok("Atalho: -1 dia", /atalho[\s\S]{0,80}?triggered\s*\?\s*-1/.test(SRC));
ok("Desespero afeta toda a Companhia", /shadowAll:\s*event\.id\s*===\s*"desespero"/.test(SRC));
ok("Más Escolhas afeta só o alvo", /shadowTarget:\s*event\.id\s*===\s*"mas-escolhas"/.test(SRC));
ok("Visão Alegre devolve Esperança", /hopeAll:\s*event\.id\s*===\s*"visao-alegre"/.test(SRC));
ok("Terrível Infortúnio Fere o alvo", /woundsTarget:\s*event\.id\s*===\s*"terrivel-infortunio"/.test(SRC));

// triggersOn "success" dispara no sucesso; "failure" dispara na falha.
ok(
  "triggered respeita triggersOn",
  /triggered\s*=\s*event\.triggersOn\s*===\s*"success"\s*\?\s*passed\s*:\s*!passed/.test(SRC)
);

/* ── Duração e marcha forçada (JOR-M03, JOR-M04) ──────────────────── */

ok("Marcha forçada: 1 dia por 2 trechos", /forcedMarch\s*\?\s*Math\.ceil\(trechos\s*\/\s*2\)/.test(SRC));
ok("Terreno difícil: +1 dia cada", /days\s*\+=\s*hard/.test(SRC));
ok("A cavalo: metade arredondando pra cima", /mounted\)\s*days\s*=\s*Math\.ceil\(days\s*\/\s*2\)/.test(SRC));
ok("Fadiga da marcha forçada: 1 por dia", /forcedMarchFatigue\s*=\s*input\.forcedMarch\s*\?\s*days\s*:\s*0/.test(SRC));
ok("Dias nunca negativos", /days\s*=\s*Math\.max\(0,\s*days\)/.test(SRC));
ok(
  "hardTerrainTrechos não passa do total",
  /hard\s*=\s*Math\.min\(trechos,/.test(SRC)
);

/* ── Áreas Perigosas (JOR-M05) ────────────────────────────────────── */

ok("Área Perigosa: eventos = valor de Perigo", /torPerilousAreaEventCount/.test(SRC));

/* ── Papéis: validação ────────────────────────────────────────────── */

ok("Exige um Guia", /precisa de um Guia/.test(SRC));
ok("Barra mais de um Guia", /S[óo] pode haver um Guia/.test(SRC));
ok("Exige os 4 papéis cobertos", /uncovered/.test(SRC));

/* ── Compêndio × código ───────────────────────────────────────────── */

for (const label of ["Guia", "Batedor", "Olheiro", "Caçador"]) {
  ok(`compêndio tem o papel ${label}`, MD.includes(`— ${label}`));
}
for (const label of [
  "Terrível Infortúnio",
  "Desespero",
  "Más Escolhas",
  "Contratempo",
  "Atalho",
  "Encontro Fortuito",
  "Visão Alegre",
]) {
  ok(`compêndio tem o evento ${label}`, MD.includes(`— ${label}`));
}

// D22: sem hexágonos no CÓDIGO. Os comentários mencionam "hex" de propósito,
// para registrar que 1 trecho = 1 hex do livro — essa explicação deve ficar.
const codeOnly = SRC
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");
ok("Sem 'hex' no código, só em comentário (D22)", !/hex/i.test(codeOnly));
ok("O comentário explica a adaptação trecho↔hex", /1 trecho = 1 hex|o livro usa "hex"/.test(SRC));

/* ── Terreno mexe em Dados de SUCESSO, não no Dado de Proeza ───────────
   O livro (06-fases-de-aventura-combate.md, §"ESTRADAS E TERRENO DIFÍCIL"):
   terreno difícil faz o herói *perder (1d)*, estrada faz *ganhar (1d)*. O
   capítulo 2 separa as duas mecânicas de propósito — "(1d)" é Dado de Sucesso,
   Favorecida/Desfavorecida é rolar dois Dados de Proeza.

   O código devolvia favoured/illFavoured, o que trocava a mecânica E criava um
   segundo problema: a REGIÃO é que mexe no Dado de Proeza, e Favorecida +
   Desfavorecida se CANCELAM — então uma estrada em Terras Sombrias apagava a
   penalidade da Região, algo que o livro nunca diz. */

const BOOK_COMBATE = readFileSync(
  join(__dirname, "..", "livros", "um-anel", "06-fases-de-aventura-combate.md"),
  "utf8"
);
ok(
  "livro: terreno difícil perde (1d), estrada ganha (1d)",
  /terreno difícil,[\s\S]{0,80}?\*perde \(1d\)\*[\s\S]{0,160}?estrada,[\s\S]{0,40}?\*ganha \(1d\)\*/i.test(
    BOOK_COMBATE.replace(/\n/g, " ")
  )
);

const terrainBody = fnBody(SRC, "terrainRollModifier");
ok("terrainRollModifier isolado", terrainBody.length > 30);
ok("estrada dá +1 Dado de Sucesso", /"estrada"\) return \{ rankDelta: 1 \}/.test(terrainBody));
ok("terreno difícil dá -1 Dado de Sucesso", /"dificil"\) return \{ rankDelta: -1 \}/.test(terrainBody));
ok("terreno normal é neutro", /return \{ rankDelta: 0 \}/.test(terrainBody));
// A REGRESSÃO: não pode voltar a devolver Favorecida/Desfavorecida.
ok(
  "terreno NÃO devolve favoured/illFavoured",
  !/favoured/i.test(terrainBody)
);

// E o painel tem de aplicar no `rank`, clampado em 0 (penalidade desce até zero).
const PANEL_J = readFileSync(
  join(__dirname, "..", "components", "vtt", "TorJourneyPanel.tsx"),
  "utf8"
);
ok(
  "painel aplica o terreno no rank, clampado em 0",
  /rank: Math\.max\(0, targetRank \+ mod\.rankDelta\)/.test(PANEL_J)
);
ok(
  "painel NÃO passa mais favoured/illFavoured de terreno",
  !/favoured: mod\./.test(PANEL_J) && !/illFavoured: mod\./.test(PANEL_J)
);
// A Região continua sendo quem mexe no Dado de Proeza — não pode ter sido perdida.
ok(
  "Região segue definindo Favorecida/Desfavorecida",
  /featRoll: "favoured"/.test(SRC) && /featRoll: "illFavoured"/.test(SRC)
);

console.log(`\nverify-um-anel-journey: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);

/* ══════════════════════════════════════════════════════════════════════
   Papéis da Jornada chegam à mesa
   ══════════════════════════════════════════════════════════════════════

   O motor sempre soube que o evento cai sobre um PAPEL, e o painel já dizia "o
   Caçador rola Caçada" — mas `validateTorRoleAssignment` não tinha consumidor e
   NINGUÉM era atribuído a papel nenhum. A mesa tinha de lembrar de cabeça quem
   era o Caçador, e sair com um papel descoberto só aparecia no primeiro evento
   daquele papel, no meio da viagem.

   E o painel imprimia o ID da Perícia ("caca", "percepcao") em vez do rótulo da
   ficha ("Caçada", "Vigilância") — a mesma divergência id × rótulo que já tinha
   sido unificada nos capítulos, vazando por outro caminho. */

const PANEL_JOURNEY = readFileSync(
  join(__dirname, "..", "components", "vtt", "TorJourneyPanel.tsx"),
  "utf8"
);
const SESSION_TS = readFileSync(
  join(__dirname, "..", "lib", "combat", "um-anel", "session-state.ts"),
  "utf8"
);

ok(
  "painel valida os papéis antes de partir",
  /validateTorRoleAssignment\(draftRoles\)/.test(PANEL_JOURNEY),
  "sair com o Caçador vago só apareceria no meio da viagem"
);
ok(
  "a validação barra a partida",
  /if \(!check\.ok\) throw new Error\(check\.reason\)/.test(PANEL_JOURNEY),
  "validar sem barrar seria decorativo"
);
ok("papéis são guardados na jornada", /roles\?: TorRoleAssignment/.test(SESSION_TS));
ok("papéis são recortados na leitura", /function normalizeRoles/.test(SESSION_TS));
ok(
  "painel oferece os quatro papéis",
  /TOR_JOURNEY_ROLES\.map\(\(role\) =>/.test(PANEL_JOURNEY)
);
ok(
  "o evento diz QUEM cobre o papel",
  /progress\.roles\?\.\[progress\.pending\.role\]/.test(PANEL_JOURNEY)
);

/* O id da Perícia não pode mais aparecer cru na tela nem no chat. */
ok(
  "painel imprime o rótulo da Perícia, não o id",
  /SKILL_LABEL\[roleMeta\.skillId as TorSkillId\]/.test(PANEL_JOURNEY) &&
    /SKILL_LABEL\[progress\.pending\.skillId as TorSkillId\]/.test(PANEL_JOURNEY),
  "a ficha diz 'Caçada'; imprimir 'caca' manda o jogador procurar o que não existe"
);
ok(
  "nenhum id de Perícia é impresso cru",
  !/\{roleMeta\.skillId\}/.test(PANEL_JOURNEY) && !/\{progress\.pending\.skillId\}/.test(PANEL_JOURNEY)
);

/* Regra do livro: um Guia só, e nenhum papel descoberto. */
ok("só pode haver um Guia", /Só pode haver um Guia/.test(SRC));
ok("a Companhia precisa cobrir os quatro papéis", /Papéis sem ninguém/.test(SRC));

/* Dívida que continua: Áreas Perigosas (JOR-M05) — a Companhia para ao entrar e
   enfrenta um evento por ponto de Perigo. O motor existe e segue sem chamador. */
const CONSUMIDORES_JORNADA = [PANEL_JOURNEY, SESSION_TS];
ok(
  "torPerilousAreaEventCount segue sem consumidor (dívida registrada)",
  !CONSUMIDORES_JORNADA.some((s) => /torPerilousAreaEventCount\(/.test(s)),
  "ligou? então atualize esta asserção"
);

console.log(`\nverify-um-anel-journey (papéis): ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
