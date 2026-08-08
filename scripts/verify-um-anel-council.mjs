/**
 * Verifica o motor de Conselho do Um Anel (D28) — entra em `npm run test`.
 *
 * Fonte: livros/um-anel/compendio/conselho.md
 *
 * O caso delicado é a ordem em torCouncilOutcome: alcançar a Resistência tem de
 * vencer mesmo na última tentativa. Inverter as checagens transformaria vitória
 * no limite em falha.
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
const SRC = readFileSync(join(__dirname, "..", "lib", "combat", "um-anel", "council.ts"), "utf8");
const DATA = readFileSync(join(__dirname, "..", "lib", "character", "um-anel", "data.ts"), "utf8");
const MD = readFileSync(
  join(__dirname, "..", "livros", "um-anel", "compendio", "conselho.md"),
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

console.log("verify-um-anel-council: motor de Conselho (livro p.105-110)");

/* ── Resistência (CON-001…003) ────────────────────────────────────── */

ok("Resistências são 3, 6 e 9", /TOR_COUNCIL_RESISTANCES\s*=\s*\[3,\s*6,\s*9\]/.test(SRC));
ok("3 = pedido razoável", /3:\s*\{[\s\S]{0,120}?label:\s*"Pedido razoável"/.test(SRC));
ok("6 = pedido ousado", /6:\s*\{[\s\S]{0,120}?label:\s*"Pedido ousado"/.test(SRC));
ok("9 = pedido ultrajante", /9:\s*\{[\s\S]{0,120}?label:\s*"Pedido ultrajante"/.test(SRC));

/* ── Perícias por etapa ───────────────────────────────────────────── */

const INTRO = ["imponencia", "cortesia", "enigma"];
const INTER = ["encorajar", "perspicacia", "persuasao", "enigma", "canto"];

for (const s of INTRO) {
  ok(
    `Introdução usa ${s}`,
    new RegExp(`TOR_INTRODUCTION_SKILLS[\\s\\S]{0,160}?"${s}"`).test(SRC)
  );
}
for (const s of INTER) {
  ok(
    `Interação usa ${s}`,
    new RegExp(`TOR_INTERACTION_SKILLS[\\s\\S]{0,200}?"${s}"`).test(SRC)
  );
}
// Enigmas é a única perícia nas duas etapas (o livro cita nas duas).
ok("Enigmas aparece nas duas etapas", INTRO.includes("enigma") && INTER.includes("enigma"));

// Todas as perícias citadas têm de existir de verdade.
for (const s of new Set([...INTRO, ...INTER])) {
  ok(`perícia "${s}" existe em data.ts`, new RegExp(`id:\\s*"${s}"`).test(DATA));
}

/* ── Introdução (CON-S02) ─────────────────────────────────────────── */

ok(
  "Sucesso: limite = Resistência + ícones",
  /timeLimit:\s*opts\.resistance\s*\+\s*bonus/.test(SRC)
);
ok("Bônus só no sucesso", /bonus\s*=\s*opts\.passed\s*\?\s*Math\.max\(0,\s*opts\.successIcons\)\s*:\s*0/.test(SRC));
ok("Falha marca Desastre para o fim", /disasterOnFailure:\s*!opts\.passed/.test(SRC));

/* ── Interação (CON-S03) ──────────────────────────────────────────── */

ok(
  "Sucesso acumula 1 + ícones",
  /gained\s*=\s*roll\.passed\s*\?\s*1\s*\+\s*Math\.max\(0,\s*roll\.successIcons\)\s*:\s*0/.test(SRC)
);
// A tentativa conta mesmo na falha — é o que aperta o limite de tempo.
ok(
  "Tentativa conta mesmo na falha",
  /attemptsUsed:\s*state\.attemptsUsed\s*\+\s*1/.test(SRC)
);
ok("Tentativas restantes nunca negativas", /Math\.max\(0,\s*next\.timeLimit\s*-\s*next\.attemptsUsed\)/.test(SRC));

/* ── A ORDEM que importa ──────────────────────────────────────────── */

const outcome = fnBody(SRC, "torCouncilOutcome");
const successIdx = outcome.indexOf("state.successes >= state.resistance");
const limitIdx = outcome.indexOf("state.attemptsUsed >= state.timeLimit");

ok("Vitória é checada por sucessos >= Resistência", successIdx >= 0);
ok("Falha é checada por tentativas esgotadas", limitIdx >= 0);
ok(
  "Vitória vem ANTES da falha (ganhar na última tentativa vale)",
  successIdx >= 0 && limitIdx >= 0 && successIdx < limitIdx,
  `sucesso@${successIdx} limite@${limitIdx}`
);
ok(
  "Desastre só quando a Introdução falhou",
  /state\.disasterOnFailure\s*\?\s*"disaster"\s*:\s*"failure"/.test(outcome)
);
ok("Sem resultado ainda = ongoing", /return\s*"ongoing"/.test(outcome));

/* ── Compêndio × código ───────────────────────────────────────────── */

for (const label of ["Pedido razoável", "Pedido ousado", "Pedido ultrajante"]) {
  ok(`compêndio tem "${label}"`, MD.includes(label));
}
for (const step of ["1. Definir a Resistência", "2. Introdução", "3. Interação"]) {
  ok(`compêndio tem a etapa "${step}"`, MD.includes(step));
}
ok("compêndio registra Resistência 3", /\*\*Resist[êe]ncia:\*\*\s*3/.test(MD));
ok("compêndio registra Resistência 6", /\*\*Resist[êe]ncia:\*\*\s*6/.test(MD));
ok("compêndio registra Resistência 9", /\*\*Resist[êe]ncia:\*\*\s*9/.test(MD));

/* ── DESASTRE tem DOIS gatilhos independentes ──────────────────────────
   Livro (06-fases-de-aventura-combate.md): "DESASTRE: os heróis-jogadores
   fracassam em todas as rolagens disponíveis, OU obtêm um número de rolagens
   bem-sucedidas mas não conseguem igualar a Resistência após uma Introdução
   malfeita".

   Só o segundo estava implementado. Uma Companhia que abre BEM o conselho
   (Introdução com sucesso, logo `disasterOnFailure` falso) e depois falha em
   TODAS as tentativas recebia "failure" — o livro manda Desastre, porque zero
   sucesso é o pior desfecho possível, independente da Introdução. */

const BOOK_COMBATE = readFileSync(
  join(__dirname, "..", "livros", "um-anel", "06-fases-de-aventura-combate.md"),
  "utf8"
);
ok(
  "livro: Desastre por fracassar em TODAS as rolagens",
  /DESASTRE:\*\*[\s\S]{0,120}?fracassam em todas as rolagens\s*disponíveis, ou obtêm/i.test(
    BOOK_COMBATE
  )
);

const outcomeBody = fnBody(SRC, "torCouncilOutcome");
ok("torCouncilOutcome isolado", outcomeBody.length > 60);
ok(
  "zero sucessos é Desastre, independente da Introdução",
  /state\.successes === 0\) return "disaster"/.test(outcomeBody)
);
ok(
  "Introdução malfeita segue sendo o outro gatilho",
  /state\.disasterOnFailure \? "disaster" : "failure"/.test(outcomeBody)
);
// A ordem não pode mudar: alcançar a Resistência vence antes de qualquer
// avaliação de Desastre, inclusive na última tentativa.
const idxSuccess = outcomeBody.indexOf('>= state.resistance) return "success"');
const idxZero = outcomeBody.indexOf('state.successes === 0');
ok(
  "sucesso é avaliado ANTES do Desastre",
  idxSuccess >= 0 && idxZero >= 0 && idxSuccess < idxZero,
  `sucesso@${idxSuccess} zero@${idxZero}`
);

console.log(`\nverify-um-anel-council: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);

/* ══════════════════════════════════════════════════════════════════════
   Atitude da audiência
   ══════════════════════════════════════════════════════════════════════

   "Suas rolagens de Perícia são modificadas pela atitude das pessoas que
   encontram" — Relutante *perde (1d)*, Aberta nada, Amigável *ganha (1d)*.

   Não existia: nem no motor, nem no estado da sala, nem no painel. E era o único
   emissor de PENALIDADE que faltava — o motor já aceitava `bonusDice` negativo e
   nada o alimentava com penalidade fora do combate.

   Duas Virtudes Culturais dependem disto existir: "Amigável e Familiar" ("o povo
   encontrado é sempre considerado Amigável") e "Amigo dos Anões" ("Anões são
   sempre considerados Amigáveis num Conselho"). */

const CAP6_COUNCIL = readFileSync(
  join(__dirname, "..", "livros", "um-anel", "06-fases-de-aventura-combate.md"),
  "utf8"
);
const COUNCIL_PANEL = readFileSync(
  join(__dirname, "..", "components", "vtt", "TorCouncilPanel.tsx"),
  "utf8"
);
const SESSION_COUNCIL = readFileSync(
  join(__dirname, "..", "lib", "combat", "um-anel", "session-state.ts"),
  "utf8"
);

ok(
  "livro: a atitude modifica as rolagens do Conselho",
  /suas rolagens de\s*\n?Perícia são modificadas pela atitude das pessoas que encontram/.test(
    CAP6_COUNCIL
  )
);
ok("livro: Relutante perde (1d)", /\*\*Relutante\*\* — \*perde \(1d\)\*/.test(CAP6_COUNCIL));
ok("livro: Aberta não modifica", /\*\*Aberta\*\* — \(nenhum modificador\)/.test(CAP6_COUNCIL));
ok("livro: Amigável ganha (1d)", /\*\*Amigável\*\* — \*ganha \(1d\)\*/.test(CAP6_COUNCIL));

ok("as três atitudes existem no motor", /TOR_COUNCIL_ATTITUDES = \["relutante", "aberta", "amigavel"\]/.test(SRC));
ok("Relutante vale −1", /relutante:[\s\S]{0,160}?diceDelta: -1/.test(SRC));
ok("Aberta vale 0", /aberta:[\s\S]{0,160}?diceDelta: 0/.test(SRC));
ok("Amigável vale +1", /amigavel:[\s\S]{0,160}?diceDelta: 1/.test(SRC));
ok(
  "atitude ausente cai em Aberta",
  /TOR_COUNCIL_ATTITUDE_META\[attitude \?\? "aberta"\]\.diceDelta/.test(SRC),
  "Conselho de sala antiga não pode ganhar nem perder dado"
);
ok(
  "atitude inválida é recortada na leitura",
  /isTorCouncilAttitude\(r\.attitude\) \? r\.attitude : "aberta"/.test(SESSION_COUNCIL)
);

/* Vale para TODAS as rolagens, inclusive a Introdução — o livro não exclui
   nenhuma, e aplicar só na Interação daria vantagem/desvantagem pela metade. */
ok(
  "a Introdução usa a atitude",
  /bonusDice: torCouncilAttitudeDice\(draftAttitude\)/.test(COUNCIL_PANEL),
  "o livro não exclui a Introdução"
);
ok(
  "a Interação usa a atitude guardada na sala",
  /bonusDice: torCouncilAttitudeDice\(council\.attitude\)/.test(COUNCIL_PANEL),
  "usar o rascunho aqui ignoraria a atitude do Conselho em andamento"
);
ok("o painel deixa escolher a atitude", /TOR_COUNCIL_ATTITUDES\.map/.test(COUNCIL_PANEL));
ok(
  "a atitude é gravada ao abrir o Conselho",
  /startTorCouncil\(draftResistance, intro, draftAttitude\)/.test(COUNCIL_PANEL)
);

console.log(`\nverify-um-anel-council (atitude): ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
