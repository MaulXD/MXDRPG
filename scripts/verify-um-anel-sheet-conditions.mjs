/**
 * Verifica as condições DERIVADAS da ficha do Um Anel — entra em `npm run test`.
 *
 * Exausto e Arrasado não são toggles: saem dos números. Este teste existe porque
 * as duas fórmulas estavam erradas de formas que ninguém notaria jogando:
 *
 *  1. Exausto comparava Resistência só com a Carga do EQUIPAMENTO, ignorando a
 *     Fadiga. O livro diz que a Fadiga eleva a Carga total — então um herói
 *     acabado de Fadiga no fim de uma jornada NÃO ficava Exausto, que é
 *     exatamente o efeito que a Fadiga existe para produzir.
 *
 *  2. Arrasado comparava só `shadow` com a Esperança, ignorando `shadowScars`.
 *     Cicatriz conta como ponto de Sombra normal para todos os efeitos
 *     (SOM-R06), então quem trocou Sombra por Cicatriz em "Endurecer a Vontade"
 *     saía de Arrasado sem ter melhorado de verdade.
 *
 * Fonte: livros/um-anel/04-caracteristicas.md §Fatigue/§Miserable,
 *        livros/um-anel/compendio/sombra.md
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
const r = (...p) => readFileSync(join(__dirname, "..", ...p), "utf8");

const NORM = r("lib", "character", "um-anel", "normalize.ts");
const RULES = r("lib", "character", "um-anel", "rules.ts");
const SHADOW = r("lib", "combat", "um-anel", "shadow.ts");
const BOOK = r("livros", "um-anel", "04-caracteristicas.md");

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

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

console.log("verify-um-anel-sheet-conditions: condições derivadas da ficha");

/* ── A regra está mesmo no livro ──────────────────────────────────── */
// Se a extração do livro mudar e a regra sumir, o teste avisa em vez de
// silenciosamente validar uma fórmula sem fonte.
ok(
  "livro: Exausto é Resistência <= Carga total",
  // Bilingue: o capitulo 04 foi traduzido durante a Fase B e esta assercao
  // quebrou. Aceita as duas formas pra nao voltar a quebrar por traducao, e
  // continua acusando se a REGRA mudar (o "igual ou inferior" e a Carga TOTAL).
  /(Weary if their Current Endurance score becomes equal to or lower than their total Load|ficam Exaustos se seu valor de Resistência Atual se tornar igual ou inferior à sua Carga total)/i.test(
    BOOK
  )
);
ok(
  "livro: Fadiga eleva a Carga total",
  /(Fatigue points temporarily raise a travelling Player-hero's total Load|pontos de Fadiga elevam temporariamente a Carga total de um herói-jogador em viagem)/i.test(
    BOOK
  )
);

/* ── Exausto ──────────────────────────────────────────────────────── */

const normCode = stripComments(NORM);

ok("Exausto soma Fadiga à Carga", /weary:\s*endurance\.value\s*<=\s*load\s*\+\s*fatigue/.test(normCode));
// A regressão que este teste tranca: voltar a comparar só com a Carga.
ok(
  "Exausto NÃO compara só com a Carga do equipamento",
  !/weary:\s*endurance\.value\s*<=\s*load\s*,/.test(normCode) &&
    !/weary:\s*endurance\.value\s*<=\s*load\s*$/m.test(normCode)
);
// computeLoad é só equipamento — a Fadiga tem de ser somada FORA dela, senão
// entraria duas vezes (a Carga é persistida na ficha).
ok(
  "computeLoad é só equipamento (não soma Fadiga)",
  !/fatigue/i.test(stripComments(RULES).split("export function computeLoad")[1] ?? "")
);

/* ── Arrasado ─────────────────────────────────────────────────────── */

ok(
  "Arrasado conta Cicatrizes",
  /miserable:\s*shadow\s*\+\s*shadowScars\s*>=\s*hope\.value/.test(normCode)
);
ok(
  "Arrasado NÃO ignora Cicatrizes",
  !/miserable:\s*shadow\s*>=\s*hope\.value/.test(normCode)
);
// Usa Esperança ATUAL, não a máxima (a máxima é o gatilho de Desfavorecido).
ok("Arrasado usa Esperança atual", /hope\.value/.test(normCode) && !/miserable:[^;]*hope\.max/.test(normCode));

/* ── Normalização defensiva de ficha legada ──────────────────────── */

ok("shadowScars normalizado com default", /const shadowScars = raw\.shadowScars \?\? 0;/.test(normCode));
ok("fatigue normalizado com default", /const fatigue = raw\.fatigue \?\? 0;/.test(normCode));
// Sem isso, ficha antiga sem os campos daria NaN nas comparações acima — e NaN
// em comparação devolve false, então o herói simplesmente nunca ficaria Exausto.
ok("shadowScars entra no retorno", /^\s*shadowScars,\s*$/m.test(normCode));
ok("fatigue entra no retorno", /^\s*fatigue,\s*$/m.test(normCode));

/* ── Ferido continua manual ───────────────────────────────────────── */
// Ferido é evento de jogo (Golpe Perfurante), não consequência de número.
ok(
  "Ferido vem do estado salvo, não é derivado",
  /wounded:\s*raw\.conditions\?\.wounded \?\? false/.test(normCode)
);

/* ── O motor e a ficha concordam ──────────────────────────────────── */
// Duas implementações da mesma regra é aceitável (contextos diferentes: ficha
// normaliza, motor decide em runtime), mas divergir não é.
ok(
  "motor: Exausto usa Carga total",
  /weary:\s*state\.enduranceValue\s*<=\s*totalTorLoad\(state\)/.test(SHADOW)
);
ok(
  "motor: Carga total soma equipamento + Fadiga",
  /Math\.max\(0,\s*state\.load\)\s*\+\s*Math\.max\(0,\s*state\.fatigue\)/.test(SHADOW)
);
ok(
  "motor: Arrasado conta Cicatrizes",
  /totalShadow\s*=\s*state\.shadow\s*\+\s*state\.shadowScars/.test(SHADOW)
);

console.log(`\nverify-um-anel-sheet-conditions: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
