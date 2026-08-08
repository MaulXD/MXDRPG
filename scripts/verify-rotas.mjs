/**
 * Nenhum redirect interno cai em 404, e toda página protegida se protege sozinha.
 *
 * POR QUE ESTE TESTE EXISTE. `app/personagem/layout.tsx` mandava o usuário sem
 * sessão para `signInPath("/personagem")` — e **`/personagem` não tem
 * `page.tsx`**. Quem abrisse um link de ficha com a sessão vencida ia para o
 * login e, depois de autenticar, caía num 404. O bug se escondia atrás de dois
 * cabeçalhos que ninguém define (`x-pathname`, `x-invoke-path`): o leitor batia o
 * olho, via o `??` e supunha que o caminho real chegava ali.
 *
 * A guarda principal aqui é GENÉRICA de propósito: em vez de proibir aqueles dois
 * cabeçalhos, ela pega TODO destino de redirect estático em `app/**` e exige que
 * ele exista. Proibir os cabeçalhos consertaria o caso e deixaria a classe do
 * problema em pé.
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

function varrer(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) varrer(caminho, acc);
    else if (/\.tsx?$/.test(nome)) acc.push(caminho);
  }
  return acc;
}

console.log("verify-rotas: redirect interno não cai em 404");

const APP = root("app");
const arquivos = varrer(APP);
ok(`varreu app/ (${arquivos.length} arquivos)`, arquivos.length > 40);

/* ── 1. Todo destino de redirect estático existe ───────────────────────── */

/** Rotas declaradas no `next.config.ts` (source → destination). */
const CONFIG = readFileSync(root("next.config.ts"), "utf8");
const REDIRECTS_CONFIG = [...CONFIG.matchAll(/source:\s*"([^"]+)"/g)].map((m) => m[1]);
ok(`next.config.ts declara redirects (${REDIRECTS_CONFIG.length})`, REDIRECTS_CONFIG.length > 0);

/**
 * Um path do app existe se houver `page.tsx` no diretório correspondente, OU se
 * algum segmento for dinâmico (`[id]`), OU se estiver nos redirects do config.
 *
 * Segmento dinâmico: `/personagem/abc` casa com `app/personagem/[id]/page.tsx`.
 * Sem isso a checagem acusaria todo destino com id dentro, que é a maioria.
 */
function rotaExiste(path) {
  const limpo = path.split("?")[0].split("#")[0];
  if (limpo === "/") return existsSync(join(APP, "page.tsx"));
  if (REDIRECTS_CONFIG.some((s) => s.split("/:")[0] === limpo.split("/").slice(0, 2).join("/")))
    return true;

  const segmentos = limpo.split("/").filter(Boolean);
  let dirs = [APP];
  for (const seg of segmentos) {
    const proximos = [];
    for (const d of dirs) {
      if (!existsSync(d)) continue;
      for (const nome of readdirSync(d)) {
        const caminho = join(d, nome);
        if (!statSync(caminho).isDirectory()) continue;
        /* Segmento literal, dinâmico `[x]`, catch-all `[...x]`, ou grupo `(x)`
           — grupo não consome segmento, então é tratado à parte abaixo. */
        if (nome === seg || /^\[.*\]$/.test(nome)) proximos.push(caminho);
      }
      /* Grupos de rota `(auth)` não aparecem na URL: descer sem consumir. */
      for (const nome of readdirSync(d)) {
        const caminho = join(d, nome);
        if (statSync(caminho).isDirectory() && /^\(.*\)$/.test(nome)) dirs.push(caminho);
      }
    }
    if (proximos.length === 0) return false;
    dirs = proximos;
  }
  return dirs.some((d) => existsSync(join(d, "page.tsx")) || existsSync(join(d, "route.ts")));
}

/* Sanidade da própria função: sem isto, um bug nela faria tudo passar. */
ok("rotaExiste reconhece rota real", rotaExiste("/mesas") && rotaExiste("/compendios"));
ok("rotaExiste reconhece segmento dinâmico", rotaExiste("/personagem/qualquer-id"));
ok("rotaExiste reconhece redirect do config", rotaExiste("/rpg"));
ok("rotaExiste RECUSA rota inexistente", !rotaExiste("/rota-que-nao-existe-mesmo"));
/* O caso que motivou o teste: `/personagem` sozinho não é rota. */
ok(
  "rotaExiste RECUSA /personagem (é só um diretório, não tem page.tsx)",
  !rotaExiste("/personagem"),
  "é exatamente para onde o layout mandava o usuário depois do login"
);

/* Agora a varredura: todo destino literal em app/**. */
const quebrados = [];
const conferidos = [];
for (const caminho of arquivos) {
  const src = stripComments(readFileSync(caminho, "utf8"));
  const destinos = [
    ...[...src.matchAll(/\bredirect\(\s*"(\/[^"]*)"\s*\)/g)].map((m) => m[1]),
    ...[...src.matchAll(/\bsignInPath\(\s*"(\/[^"]*)"\s*\)/g)].map((m) => m[1]),
  ];
  for (const d of destinos) {
    conferidos.push(d);
    if (!rotaExiste(d)) quebrados.push(`${rel(caminho)} → ${d}`);
  }
}

/* SEM ESTA LINHA a asserção seguinte passa vazia. Se o regex parar de casar —
   porque alguém trocou aspas duplas por crase, ou passou o destino por variável
   — `quebrados` fica vazio e o teste diz "tudo certo" sem ter olhado nada. Já
   aconteceu neste repositório com outra checagem negativa. */
ok(
  `a varredura encontrou destinos para conferir (${conferidos.length})`,
  conferidos.length >= 10,
  "checagem negativa que não achou nada é checagem que não roda"
);
ok(
  "todo redirect estático em app/ aponta para rota que existe",
  quebrados.length === 0,
  quebrados.join(" · ")
);

/* ── 2. Toda página sob /personagem se protege sozinha ─────────────────── */

/* O gate saiu do layout. Isso só é seguro enquanto cada página filha tiver a
   própria guarda — uma página nova sem guarda ficaria pública em silêncio.
   Varre DIRETÓRIO: uma lista fixa não veria o arquivo novo. */
const PAGINAS_PERSONAGEM = varrer(root("app", "personagem")).filter((c) => /page\.tsx$/.test(c));
ok(`há páginas sob /personagem (${PAGINAS_PERSONAGEM.length})`, PAGINAS_PERSONAGEM.length >= 3);

const desprotegidas = PAGINAS_PERSONAGEM.filter((c) => {
  const src = stripComments(readFileSync(c, "utf8"));
  return !(/getSession\(/.test(src) && /if\s*\(\s*!session\s*\)/.test(src));
});
ok(
  "toda página sob /personagem tem guarda de sessão própria",
  desprotegidas.length === 0,
  desprotegidas.map(rel).join(" · ")
);

/* E o layout NÃO pode voltar a redirecionar: se voltar, anula as guardas das
   filhas de novo e o destino volta a ser errado. */
const LAYOUT = stripComments(readFileSync(root("app", "personagem", "layout.tsx"), "utf8"));
ok(
  "o layout de /personagem não redireciona",
  !/redirect\(/.test(LAYOUT),
  "o layout roda antes das páginas e anulava o redirect correto delas"
);
ok(
  "o layout não lê cabeçalho de caminho que não existe",
  !/x-pathname|x-invoke-path/.test(LAYOUT),
  "nem o middleware define, nem o Next injeta — o fallback era o único ramo real"
);
/* Lado OPOSTO: sem sessão o layout tem de devolver children, não estourar em
   `session.user`. Se alguém apagar essa linha, o shell recebe null. */
ok(
  "sem sessão o layout devolve children para a filha decidir",
  /if\s*\(\s*!session\s*\)\s*return\s*<>\{children\}<\/>/.test(LAYOUT)
);

/* ── 3. Nenhum cabeçalho fantasma sobrou em app/ ───────────────────────── */

/* O padrão errado pode ter sido copiado para outro layout. Varredura genérica,
   condicional: o cabeçalho pode ser CITADO se o middleware realmente o definir. */
const MIDDLEWARE = existsSync(root("middleware.ts"))
  ? stripComments(readFileSync(root("middleware.ts"), "utf8"))
  : "";
const middlewareDefine = /headers\.set\(\s*["']x-(pathname|invoke-path)["']/.test(MIDDLEWARE);
const usamFantasma = arquivos.filter((c) =>
  /x-pathname|x-invoke-path/.test(stripComments(readFileSync(c, "utf8")))
);
ok(
  "ninguém lê x-pathname/x-invoke-path sem o middleware definir",
  middlewareDefine || usamFantasma.length === 0,
  usamFantasma.map(rel).join(" · ")
);

console.log(`\nverify-rotas: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
