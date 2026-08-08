/**
 * O compêndio de Eldarin: busca, ordem, painel de detalhe e abas de sistema.
 *
 * Quatro defeitos que viviam quase todos no mesmo componente:
 *
 *  1. **O painel de detalhe sumia ao digitar.** `selected` era derivado de
 *     `entries`, que já é o resultado da busca — bastava o usuário digitar
 *     qualquer coisa que não casasse com o item aberto para a ficha desaparecer
 *     da tela.
 *  2. **A busca ignorava o código de catálogo**, embora ele fosse EXIBIDO em
 *     `<code>` no painel de detalhe e **as 571 entradas dos seis packs** tenham o
 *     campo. Digitar o código que estava na tela não achava nada.
 *  3. **Nada era ordenado** — a lista saía na ordem bruta do gerador de JSON.
 *  4. **As abas de sistema sumiam dentro de um pack**: `/compendios` tinha o
 *     seletor Eldarin ↔ O Um Anel, `/compendios/armas` não. Entrar num pack
 *     prendia o usuário num sistema, o que é isolamento de hub quebrado na
 *     navegação.
 *
 * A busca tem DOIS caminhos — o filtro do cliente e o `getPackEntries` do
 * servidor. Este teste confere os dois: se só um souber procurar por código, o
 * resultado muda conforme a busca rodar no navegador ou no servidor.
 */
import { readFileSync as rawReadFileSync, readdirSync, statSync, existsSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);
const rel = (p) => relative(root(), p).replace(/\\/g, "/");

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

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

console.log("verify-compendium-ui: busca, ordem, detalhe e abas do compêndio");

const BROWSER = stripComments(
  readFileSync(root("components", "compendium", "CompendiumBrowser.tsx"), "utf8")
);
const REGISTRY = stripComments(readFileSync(root("lib", "compendium", "registry.ts"), "utf8"));

/* ── 1. O painel de detalhe não depende da busca ───────────────────────── */

/* A asserção é sobre a REGRA, não sobre o nome da variável: o item selecionado
   tem de ser procurado numa lista que a busca não filtrou. */
ok(
  "o item selecionado NÃO é procurado na lista já filtrada",
  !/const selected\s*=\s*entries\./.test(BROWSER),
  "derivar de `entries` faz o painel sumir assim que o usuário digita"
);
ok(
  "o item selecionado é procurado na lista completa do pack",
  /const selected\s*=\s*todas\.find/.test(BROWSER)
);
/* Lado OPOSTO: `todas` tem de ser mesmo a lista sem filtro de busca. Se alguém
   passar a filtrar ali, a asserção acima vira decorativa. */
const blocoTodas = BROWSER.slice(BROWSER.indexOf("const todas"), BROWSER.indexOf("const entries"));
ok(
  "…e a lista completa não aplica a busca",
  blocoTodas.length > 0 && !/query/.test(blocoTodas),
  "se `todas` filtrar por query, o defeito volta com outro nome"
);

/* ── 2. A busca procura pelo código de catálogo, nos DOIS caminhos ─────── */

ok("o filtro do cliente procura por catalogId", /catalogId/.test(BROWSER));
ok("o filtro do servidor procura por catalogId", /catalogId/.test(REGISTRY));

/* E o campo existe mesmo em todas as entradas — a afirmação "571/571 têm o
   campo" não pode ficar só no comentário. Conferida contra o dado. */
const PACKS = ["armas", "habilidades", "magias", "equipamentos", "consumiveis", "monstros"];
let total = 0;
let comCodigo = 0;
for (const p of PACKS) {
  const dados = JSON.parse(readFileSync(root("data", "compendiums", `${p}.json`), "utf8"));
  total += dados.length;
  comCodigo += dados.filter((e) => e?.system?.catalogId).length;
}
ok(`o compêndio tem entradas para conferir (${total})`, total > 400);
ok(
  `toda entrada tem código de catálogo (${comCodigo}/${total})`,
  comCodigo === total,
  "se alguma não tiver, buscar pelo código deixa de ser confiável"
);

/* E o código é REALMENTE exibido — buscar por algo invisível não resolveria
   nada. É a razão de o defeito importar. */
ok("o código de catálogo é exibido na tela", /<code>\{catalogId\}<\/code>/.test(BROWSER));

/* ── 3. A lista sai ordenada, nos dois caminhos ────────────────────────── */

ok("o cliente ordena a lista", /\.sort\(/.test(BROWSER));
ok("o servidor ordena a lista", /\.sort\(/.test(REGISTRY));
/* `localeCompare` com locale pt-BR: sem ele, "Água" cai depois de "Zarabatana". */
ok(
  "a ordenação respeita acento do português",
  /localeCompare\([^)]*"pt-BR"\)/.test(BROWSER) && /localeCompare\([^)]*"pt-BR"\)/.test(REGISTRY)
);

/* ── 4. As abas de sistema existem nas DUAS rotas ──────────────────────── */

/* Isolamento de hub na navegação: entrar num pack não pode prender o usuário
   num sistema. Varre o diretório de rotas do compêndio — uma rota nova sem as
   abas quebra o teste. */
function varrer(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) varrer(caminho, acc);
    else if (/^page\.tsx$/.test(nome)) acc.push(caminho);
  }
  return acc;
}
const ROTAS = varrer(root("app", "compendios"));
ok(`há rotas de compêndio (${ROTAS.length})`, ROTAS.length >= 2);

const semAbas = ROTAS.filter((c) => {
  const src = stripComments(readFileSync(c, "utf8"));
  return !/RpgSystemContentTabs/.test(src);
});
ok(
  "toda rota de compêndio monta as abas de sistema",
  semAbas.length === 0,
  semAbas.map(rel).join(" · ")
);

/* ── 5. Nenhuma classe `comp-*` usada sem CSS que a defina ─────────────── */

/* O caminho é conferido, não suposto: escrevi `app/compendium.css` de cabeça e o
   arquivo está em `components/compendium/`. A asserção falhou alto em vez de
   pular a seção em silêncio — que é justamente por que ela existe. */
const CSS_PATHS = [
  root("components", "compendium", "compendium.css"),
  root("app", "compendium.css"),
  root("styles", "compendium.css"),
];
const cssPath = CSS_PATHS.find((p) => existsSync(p));
if (!cssPath) {
  /* Se o arquivo mudar de lugar, é melhor falhar do que pular em silêncio. */
  ok("o CSS do compêndio foi encontrado", false, `procurei em ${CSS_PATHS.map(rel).join(", ")}`);
} else {
  const CSS = readFileSync(cssPath, "utf8");
  const COMPONENTES = readdirSync(root("components", "compendium"))
    .filter((f) => /\.tsx$/.test(f))
    .map((f) => root("components", "compendium", f));

  const usadas = new Set();
  for (const c of COMPONENTES) {
    const src = stripComments(readFileSync(c, "utf8"));
    for (const m of src.matchAll(/className="([^"]*)"/g)) {
      for (const cls of m[1].split(/\s+/)) if (/^comp-/.test(cls)) usadas.add(cls);
    }
  }
  ok(`classes comp-* em uso (${usadas.size})`, usadas.size > 10);

  const semCss = [...usadas].filter((cls) => !CSS.includes(`.${cls}`));
  ok(
    "toda classe comp-* usada tem definição no CSS",
    semCss.length === 0,
    semCss.join(" · ")
  );
}

console.log(`\nverify-compendium-ui: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
