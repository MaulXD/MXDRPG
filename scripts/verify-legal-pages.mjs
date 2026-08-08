/**
 * Páginas legais (LGPD) — o que vai ao ar é a política, não recado de dev.
 *
 * POR QUE ESTE TESTE EXISTE. `app/privacidade/page.tsx` lia
 * `docs/PRIVACIDADE-LGPD.md` com `fs.readFileSync` dentro de um `try/catch {}`
 * silencioso e um fallback literal. Mas `docs/` está no `.dockerignore` — na
 * imagem de produção o arquivo NUNCA existe, o `catch` engolia a falha, e o que
 * a plataforma publicava como política de privacidade era:
 *
 *   "Política em atualização. Edite docs/PRIVACIDADE-LGPD.md com e-mail do
 *    titular antes do lançamento."
 *
 * Um recado interno de desenvolvedor no lugar de um documento com efeito legal.
 * Este teste impede a volta disso por qualquer um dos três caminhos: o fallback,
 * a leitura de arquivo, e o `docs/` ignorado no build.
 *
 * Ele também confere que o texto DÁ PARA LER: a fórmula de contraste WCAG está
 * implementada aqui dentro (é aritmética pura, não precisa de ferramenta) e roda
 * contra os tokens reais de `app/globals.css`. Política de privacidade escrita em
 * cinza ilegível é problema de conformidade, não de gosto.
 */
import { readFileSync as rawReadFileSync, existsSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

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

console.log("verify-legal-pages: o que vai ao ar é a política, não recado de dev");

/**
 * Tira comentários antes de procurar padrão proibido.
 *
 * Aprendido do jeito difícil, aqui mesmo: a primeira versão deste teste acusou
 * `conteudo.tsx` de conter o texto de fallback e de chamar `readFileSync` — mas
 * as duas coisas estavam no COMENTÁRIO que explica por que o arquivo existe. A
 * asserção estava certa sobre a string e errada sobre o arquivo. Documentar a
 * falha antiga é obrigatório; repetir a falha, não.
 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

const PAGE = stripComments(readFileSync(root("app", "privacidade", "page.tsx"), "utf8"));
const CONTEUDO = stripComments(readFileSync(root("app", "privacidade", "conteudo.tsx"), "utf8"));
const MD = readFileSync(root("docs", "PRIVACIDADE-LGPD.md"), "utf8");
const GLOBALS = readFileSync(root("app", "globals.css"), "utf8");
const DOCKERIGNORE = existsSync(root(".dockerignore"))
  ? readFileSync(root(".dockerignore"), "utf8")
  : "";

/* ── 1. O texto de desenvolvedor não pode existir em app/ ──────────────── */

/* A frase inteira, não um pedaço: banir só "Edite docs/" pegaria comentário
   legítimo. É a string que ia ao ar que está proibida. */
const FALLBACK = "Política em atualização";
ok(
  "a página não contém o texto de fallback de desenvolvedor",
  !PAGE.includes(FALLBACK) && !CONTEUDO.includes(FALLBACK),
  "essa frase era o que a produção publicava como política de privacidade"
);

/* ── 2. A página não pode depender de arquivo fora do build ────────────── */

/* Duas guardas para a MESMA falha, porque ela tem duas metades: ler do disco, e
   engolir o erro de leitura. Consertar só uma deixaria a outra armada. */
ok(
  "a página não lê arquivo do disco",
  !/readFileSync|require\(\s*["']fs["']|from\s+["']fs["']/.test(PAGE) &&
    !/readFileSync|from\s+["']fs["']/.test(CONTEUDO),
  "docs/ está no .dockerignore — em produção a leitura sempre falha"
);
ok(
  "a página não tem catch vazio",
  !/catch\s*(\([^)]*\))?\s*\{\s*(\/\*[^*]*\*\/)?\s*\}/.test(PAGE) &&
    !/catch\s*(\([^)]*\))?\s*\{\s*(\/\*[^*]*\*\/)?\s*\}/.test(CONTEUDO),
  "foi o catch silencioso que escondeu a falha até chegar em produção"
);

/* LADO OPOSTO da mudança: se um dia alguém voltar a ler o markdown, `docs/` tem
   de sair do .dockerignore no mesmo commit. A asserção aceita as duas soluções e
   proíbe a combinação quebrada. */
const leDoDisco = /readFileSync/.test(PAGE) || /readFileSync/.test(CONTEUDO);
const docsIgnorado = /^docs\/?$/m.test(DOCKERIGNORE);
ok(
  "não existe a combinação 'lê docs/' + 'docs/ fora do build'",
  !(leDoDisco && docsIgnorado),
  "é exatamente essa combinação que publicava o recado de dev"
);

/* ── 3. O conteúdo publicado é mesmo a política ────────────────────────── */

const CONTATO = "ti@thep.com.br";
ok("o conteúdo traz o e-mail do titular", CONTEUDO.includes(CONTATO));
ok("…e o markdown de referência traz o mesmo e-mail", MD.includes(CONTATO));
ok("o conteúdo cita a LGPD e a base legal", /LGPD/.test(CONTEUDO) && /Base Legal/.test(CONTEUDO));
ok("o conteúdo aponta para a ANPD", /gov\.br\/anpd/.test(CONTEUDO));

/* As duas versões não podem divergir em silêncio: toda seção numerada do
   markdown precisa de um <h2> correspondente no componente. Comparar os TÍTULOS,
   não a contagem — contagem igual com títulos trocados passaria. */
const secoesMd = [...MD.matchAll(/^## (\d+\. .+)$/gm)].map((m) => m[1].trim());
ok(`o markdown tem seções numeradas (${secoesMd.length})`, secoesMd.length >= 10);
const semPar = secoesMd.filter((titulo) => !CONTEUDO.includes(`>${titulo}<`));
ok(
  "toda seção do markdown tem <h2> correspondente no componente",
  semPar.length === 0,
  `sem par: ${semPar.join(" | ")}`
);

/* ── 4. O documento dá para LER ────────────────────────────────────────── */

/** Luminância relativa WCAG 2.x de um hex #rrggbb. */
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Razão de contraste WCAG entre dois hex. */
function contraste(a, b) {
  const [la, lb] = [luminancia(a), luminancia(b)];
  const [claro, escuro] = la > lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (escuro + 0.05);
}

/* Sanidade da própria fórmula, com os dois casos que todo mundo conhece de cor.
   Sem isto, um erro na conta faria as asserções abaixo passarem sempre. */
ok("a fórmula de contraste está certa (preto/branco = 21)", Math.abs(contraste("#000000", "#ffffff") - 21) < 0.01);
ok("a fórmula de contraste está certa (mesma cor = 1)", Math.abs(contraste("#8a7d68", "#8a7d68") - 1) < 0.001);

/** Lê um token de cor de `:root` em globals.css. */
function token(nome) {
  const m = GLOBALS.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`));
  return m ? m[1] : null;
}

const TEXT = token("text");
const TEXT_STRONG = token("text-strong");
const TEXT_MUTED = token("text-muted");
ok("os tokens de texto existem em globals.css", Boolean(TEXT && TEXT_STRONG && TEXT_MUTED));

/* `--glass` é rgba com alpha alto sobre fundo escuro; a cor efetiva é o próprio
   rgb dela. Lido do arquivo em vez de fixado aqui — dois lados, não um. */
const glassMatch = GLOBALS.match(/--glass:\s*rgba\((\d+),\s*(\d+),\s*(\d+)/);
ok("o token --glass existe e é rgba", Boolean(glassMatch));
const FUNDO = glassMatch
  ? "#" + [1, 2, 3].map((i) => Number(glassMatch[i]).toString(16).padStart(2, "0")).join("")
  : "#000000";

const MIN_AA = 4.5;

/* O achado que motivou a mudança: o texto muted NÃO serve para corpo de
   documento legal. Esta asserção trava a regressão pelo motivo certo — ela
   falha no dia em que alguém trocar o corpo de volta para --text-muted. */
const razaoMuted = contraste(TEXT_MUTED, FUNDO);
const razaoText = contraste(TEXT, FUNDO);
console.log(
  `    (medido: --text-muted ${razaoMuted.toFixed(2)}:1 · --text ${razaoText.toFixed(2)}:1 sobre ${FUNDO})`
);
ok(
  `--text passa em AA sobre o card (${razaoText.toFixed(2)}:1 ≥ ${MIN_AA})`,
  razaoText >= MIN_AA
);
ok(
  `--text-strong passa em AA sobre o card (${contraste(TEXT_STRONG, FUNDO).toFixed(2)}:1 ≥ ${MIN_AA})`,
  contraste(TEXT_STRONG, FUNDO) >= MIN_AA
);
ok(
  "…e --text-muted continua REPROVANDO — é por isso que o corpo não o usa",
  razaoMuted < MIN_AA,
  "se um dia ele passar, o comentário do CSS precisa mudar junto"
);

/* Agora a regra de verdade: o CSS do documento legal usa o token aprovado. */
const bloco = GLOBALS.slice(GLOBALS.indexOf(".legal-doc {"));
const blocoLegal = bloco.slice(0, bloco.indexOf("\n}\n\n.legal-doc__table tr") + 200);
ok("existe bloco CSS .legal-doc", GLOBALS.includes(".legal-doc {"));
ok(
  "o corpo do documento legal NÃO usa --text-muted",
  !/\.legal-doc\s*\{[^}]*--text-muted/.test(GLOBALS),
  `--text-muted reprova em AA (${razaoMuted.toFixed(2)}:1)`
);
ok("o corpo do documento legal usa --text", /\.legal-doc\s*\{[^}]*var\(--text\)/.test(GLOBALS));

/* A tabela rola dentro do contêiner — a página não pode rolar na horizontal. */
ok(
  "a tabela do documento rola dentro do próprio contêiner",
  /\.legal-doc__table-wrap\s*\{[^}]*overflow-x:\s*auto/.test(GLOBALS)
);

console.log(`\nverify-legal-pages: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
