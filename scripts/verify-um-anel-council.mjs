/**
 * Verifica o motor de Conselho do Um Anel (D28) — entra em `npm run test`.
 *
 * Fonte: livros/um-anel/compendio/conselho.md
 *
 * O caso delicado é a ordem em torCouncilOutcome: alcançar a Resistência tem de
 * vencer mesmo na última tentativa. Inverter as checagens transformaria vitória
 * no limite em falha.
 */
import { readFileSync } from "fs";
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

console.log(`\nverify-um-anel-council: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
