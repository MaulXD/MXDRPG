/**
 * Verifica o motor de progressão e Fase de Companhia do Um Anel (D29).
 * Entra em `npm run test`.
 *
 * Fonte: livros/um-anel/compendio/progressao.md
 *
 * Os pontos que mais se erram e que estão trancados aqui:
 *  - Perícia gasta pontos de PERÍCIA; Proficiência/Valor/Sabedoria gastam pontos de AVENTURA
 *  - Valor e Sabedoria não podem AMBOS subir na mesma Fase
 *  - Valor → Recompensa; Sabedoria → Virtude (Cultural só a partir de Sabedoria 2)
 *  - Cicatrizes NÃO saem na recuperação da Fase
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(
  join(__dirname, "..", "lib", "combat", "um-anel", "progression.ts"),
  "utf8"
);
const MD = readFileSync(
  join(__dirname, "..", "livros", "um-anel", "compendio", "progressao.md"),
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

function fnBody(src, name) {
  const start = src.indexOf(`export function ${name}`);
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const end = rest.indexOf("\nexport ");
  return end < 0 ? rest : rest.slice(0, end);
}

console.log("verify-um-anel-progression: progressão e Fase de Companhia (livro p.117-124, 78)");

/* ── Tabela de custos ─────────────────────────────────────────────── */

const COSTS = { 1: 4, 2: 8, 3: 12, 4: 20, 5: 26, 6: 30 };
for (const [level, cost] of Object.entries(COSTS)) {
  ok(`Nível ${level} custa ${cost}`, new RegExp(`\\b${level}:\\s*${cost},?`).test(SRC));
  ok(`compêndio: nível ${level} custa ${cost}`, new RegExp(`\\*\\*Custo:\\*\\*\\s*${cost}\\b`).test(MD));
}
ok("Máximo de graduação é 6", /TOR_MAX_RATING\s*=\s*6/.test(SRC));

/* ── Bolsos separados de pontos ───────────────────────────────────── */

const skillBody = fnBody(SRC, "priceTorSkillRank");
const profBody = fnBody(SRC, "priceTorProficiencyRank");
const vwBody = fnBody(SRC, "priceTorValourOrWisdomRank");

ok("Perícia usa pontos de Perícia", /availableSkillPoints/.test(skillBody));
ok("Perícia NÃO usa pontos de Aventura", skillBody.length > 0 && !/availableAdventurePoints/.test(skillBody));
ok("Proficiência usa pontos de Aventura", /availableAdventurePoints/.test(profBody));
ok("Proficiência NÃO usa pontos de Perícia", profBody.length > 0 && !/availableSkillPoints/.test(profBody));
ok("Valor/Sabedoria usam pontos de Aventura", /availableAdventurePoints/.test(vwBody));
ok(
  "Valor/Sabedoria NÃO usam pontos de Perícia",
  vwBody.length > 0 && !/availableSkillPoints/.test(vwBody)
);

/* ── Valor e Sabedoria começam em 1 ───────────────────────────────── */

ok("Primeiro degrau comprável de Valor/Sabedoria é 2", /target\s*<\s*2/.test(vwBody));
ok(
  "compêndio registra que começam em 1 na criação",
  /come[çc]am em 1 na cria[çc][ãa]o/.test(MD)
);

/* ── Limites por Fase ─────────────────────────────────────────────── */

ok(
  "1 grau por Perícia por Fase",
  /canBuyTorSkillThisPhase[\s\S]{0,300}?skillRanks\[skillId\]\s*\?\?\s*0\)\s*>=\s*1/.test(SRC)
);
ok(
  "1 grau por Proficiência por Fase",
  /canBuyTorProficiencyThisPhase[\s\S]{0,320}?proficiencyRanks\[proficiencyId\]\s*\?\?\s*0\)\s*>=\s*1/.test(
    SRC
  )
);

// O limite crítico: comprar QUALQUER um dos dois bloqueia os dois.
const vwPhase = fnBody(SRC, "canBuyTorValourOrWisdomThisPhase");
ok(
  "Valor OU Sabedoria: comprar um bloqueia o outro",
  /purchases\.boughtValour\s*\|\|\s*purchases\.boughtWisdom/.test(vwPhase)
);
ok(
  "A checagem não é por eixo (não recebe `which`)",
  vwPhase.length > 0 && !/which/.test(vwPhase)
);

/* ── Ganhos por novo grau ─────────────────────────────────────────── */

const grantBody = fnBody(SRC, "torRankGrant");
ok("Valor concede Recompensa", /"valour"\)\s*return\s*\{\s*kind:\s*"reward"\s*\}/.test(grantBody));
ok("Sabedoria concede Virtude", /kind:\s*"virtue"/.test(grantBody));
ok(
  "Virtude Cultural só a partir de Sabedoria 2",
  /culturalAllowed:\s*newRank\s*>=\s*2/.test(grantBody)
);
ok(
  "compêndio registra Virtude Cultural a partir de Sabedoria 2",
  /a partir de Sabedoria 2/.test(MD)
);

/* ── Recuperação espiritual ───────────────────────────────────────── */

const RELIEF = { nenhum: 0, marginal: 1, ativo: 2, notavel: 3 };
for (const [outcome, points] of Object.entries(RELIEF)) {
  ok(
    `Resultado "${outcome}" remove até ${points} Sombra`,
    new RegExp(`${outcome}:\\s*${points}`).test(SRC)
  );
}

const recBody = fnBody(SRC, "applyTorSpiritualRecovery");
ok("Yule recupera TODA a Esperança", /opts\.isYule\s*\?\s*hopeRoom/.test(recBody));
ok("Fase comum recupera Esperança = Coração", /opts\.heartScore/.test(recBody));
ok("Esperança não passa do máximo", /hopeRoom\s*=\s*Math\.max\(0,\s*state\.hopeMax\s*-\s*state\.hopeValue\)/.test(recBody));
// O ponto crítico: Cicatrizes não saem aqui.
ok("Recuperação da Fase NÃO remove Cicatriz", recBody.length > 0 && !/shadowScars:/.test(recBody));
ok("Sombra removida limitada pelo teto do resultado", /Math\.min\(cap,\s*requested\)/.test(recBody));
ok(
  "Sombra removida nunca passa da Sombra atual",
  /Math\.min\(state\.shadow,/.test(recBody)
);
ok(
  "compêndio registra que Cicatrizes não saem na Fase",
  /Cicatrizes de Sombra n[ãa]o saem aqui/.test(MD)
);

/* ── Yule e calendário ────────────────────────────────────────────── */

ok("Yule a cada 3 Fases", /TOR_PHASES_PER_YEAR\s*=\s*3/.test(SRC));

const calBody = fnBody(SRC, "advanceTorCalendar");
ok("Yule vira o ano", /year:\s*calendar\.year\s*\+\s*1/.test(calBody));
ok("Yule zera a contagem de Fases", /phasesThisYear:\s*0/.test(calBody));
ok("Yule envelhece 1 ano", /yearsAged:\s*isYule\s*\?\s*1\s*:\s*0/.test(calBody));
ok(
  "Yule dá pontos de Perícia = Astúcia",
  /bonusSkillPoints:\s*isYule\s*\?\s*Math\.max\(0,\s*opts\.witsScore\)/.test(calBody)
);
ok("Fase comum não envelhece nem bonifica", /:\s*0,?\s*$/m.test(calBody));

/* ── Empreitadas ──────────────────────────────────────────────────── */

const budgetBody = fnBody(SRC, "torUndertakingBudget");
ok(
  "Fase comum: 1 base",
  /base\s*=\s*opts\.isYule\s*\?\s*Math\.max\(1,\s*opts\.companySize\)\s*:\s*1/.test(budgetBody)
);
ok("Yule: 1 por herói", /Math\.max\(1,\s*opts\.companySize\)/.test(budgetBody));
ok("Sempre 1 extra grátis", /free\s*=\s*1/.test(budgetBody));
ok("Total = base + grátis", /total:\s*base\s*\+\s*free/.test(budgetBody));

const valBody = fnBody(SRC, "validateTorUndertakings");
ok("Barra estourar o orçamento", /picks\.length\s*>\s*budget\.total/.test(valBody));
ok("Barra Empreitada de Yule fora do Yule", /!opts\.isYule\s*&&\s*yuleOnly\.length\s*>\s*0/.test(valBody));
ok("Barra Empreitada repetida", /Empreitada repetida/.test(valBody));
ok(
  "Empreitada de Yule pode repetir",
  /if\s*\(p\.yuleOnly\)\s*continue;/.test(valBody)
);

/* ── Nível de Companhia ───────────────────────────────────────────── */

const fellowBody = fnBody(SRC, "torFellowshipLevel");
ok("Nível soma o bônus do Patrono", /baseLevel\s*\+\s*Math\.max\(0,\s*opts\.patronBonus/.test(fellowBody));
ok("Nível nunca negativo", /Math\.max\(0,/.test(fellowBody));

/* ── Crónica ──────────────────────────────────────────────────────── */

ok("Crónica é imutável (append sem mutar)", /\[\.\.\.chronicle,\s*entry\]/.test(SRC));
ok("Entrada da Crónica registra ano e Fase", /year:\s*number;[\s\S]{0,80}?phase:\s*number/.test(SRC));

/* ── Compêndio × código ───────────────────────────────────────────── */

for (const label of [
  "Um grau por Perícia",
  "Um grau por Proficiência de Combate",
  "Valor OU Sabedoria, nunca os dois",
  "Novo grau de Valor",
  "Novo grau de Sabedoria",
  "O Passar dos Anos",
  "Nível de Companhia e Patrono",
]) {
  ok(`compêndio tem "${label}"`, MD.includes(`— ${label}`));
}

/* ── Isolamento de hub ────────────────────────────────────────────── */

// Olha o especificador do módulo, não a linha: imports multi-linha começam com
// `import {` e o caminho só aparece no `from "..."` várias linhas abaixo.
const moduleSpecifiers = [...SRC.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
const foreign = moduleSpecifiers.filter((m) => m.startsWith("@/") && !m.includes("um-anel"));
ok("Não importa nada do Eldarin", foreign.length === 0, foreign.join(" | "));
ok("Importa de um-anel (sanity do próprio teste)", moduleSpecifiers.some((m) => m.includes("um-anel")));

console.log(`\nverify-um-anel-progression: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
