/**
 * Nenhum recado de desenvolvedor chega à tela do usuário.
 *
 * POR QUE ESTE TESTE EXISTE. Três lugares mostravam instrução interna a quem só
 * queria usar o produto:
 *
 *  - `app/mesa/[roomId]/page.tsx` — a tela de convite vencido mandava o visitante
 *    "rodar `npm run homolog:up` ou `npm run local` com `npm run dev:homolog`
 *    (MariaDB local)". Quem clicou num link de convite não tem repositório.
 *  - `components/compendium/CompendiumBrowser.tsx` — renderizava
 *    "Fase 2: arrastar para ficha ou mesa." para todo visitante de `/compendios`.
 *    Número de fase de projeto não significa nada para quem lê.
 *  - `app/instalar/page.tsx` — documentação de deploy servida publicamente e
 *    **sem link nenhum apontando para ela**, duplicando o `DEPLOY.md` que já tem
 *    103 linhas e cobre mais. A página foi removida.
 *
 * A varredura é por DIRETÓRIO e por VOCABULÁRIO, não por lista de arquivos: o
 * ponto é impedir a reincidência em telas que ainda nem existem.
 *
 * ENQUADRAMENTO, porque isso mudou durante a auditoria: **isto é limpeza, não
 * exposição de segredo**. Os termos abaixo são nomes de variável e de comando,
 * não valores. O que está errado é o produto falar com o usuário em linguagem de
 * quem mantém o produto.
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
  if (!existsSync(dir)) return acc;
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) varrer(caminho, acc);
    else if (/\.tsx$/.test(nome)) acc.push(caminho);
  }
  return acc;
}

console.log("verify-sem-texto-dev: o produto não fala com o usuário em linguagem de mantenedor");

const arquivos = [...varrer(root("app")), ...varrer(root("components"))];
ok(`varreu app/ e components/ (${arquivos.length} .tsx)`, arquivos.length > 100);

/** Vocabulário que nunca deve aparecer em texto de tela. */
const PROIBIDOS = [
  ["npm run", "comando de terminal"],
  ["MariaDB", "nome do banco, detalhe de infraestrutura"],
  ["Fase 2:", "número de fase do roadmap interno"],
  ["DEPLOY.md", "arquivo de documentação do repositório"],
  ["SESSION_SECRET", "nome de variável de ambiente"],
  ["DATABASE_URL", "nome de variável de ambiente"],
  ["docker build", "comando de terminal"],
  ["process.env", "detalhe de implementação (em texto de tela)"],
];

/**
 * Extrai o TEXTO que o usuário vê, e só ele.
 *
 * Recortar por arquivo inteiro acusaria comentário legítimo (o que explica ESTA
 * correção, por exemplo) e chamada de código como `process.env.NODE_ENV`. Então:
 * tira comentário, e depois pega só conteúdo textual de JSX — o que está entre
 * `>` e `<`, mais literais de string.
 */
function textoDeTela(src) {
  const semComentario = stripComments(src);
  const entreTags = [...semComentario.matchAll(/>([^<>{}]{4,})</g)].map((m) => m[1]);
  const literais = [...semComentario.matchAll(/["'`]([^"'`\n]{4,})["'`]/g)].map((m) => m[1]);
  return [...entreTags, ...literais].join("\n");
}

/* Sanidade da função: sem isso, uma extração quebrada faria tudo passar. */
ok(
  "textoDeTela pega texto entre tags",
  textoDeTela("<p>Rode npm run homolog:up agora</p>").includes("npm run")
);
ok(
  "textoDeTela pega literal de string",
  textoDeTela('const msg = "rode npm run dev";').includes("npm run")
);
ok(
  "textoDeTela IGNORA comentário",
  !textoDeTela("// antes isto dizia npm run homolog\nconst x = 1;").includes("npm run")
);
ok(
  "textoDeTela IGNORA bloco de comentário",
  !textoDeTela("/* explicava o npm run antigo */\nconst x = 1;").includes("npm run")
);

const infratores = [];
let examinados = 0;
for (const caminho of arquivos) {
  const texto = textoDeTela(readFileSync(caminho, "utf8"));
  examinados += texto.length;
  for (const [termo, porque] of PROIBIDOS) {
    if (texto.includes(termo)) infratores.push(`${rel(caminho)} → "${termo}" (${porque})`);
  }
}

/* Checagem negativa precisa provar que examinou alguma coisa. Se `textoDeTela`
   parar de extrair — por mudança de formatação, por exemplo — `infratores` fica
   vazio e o teste diz "tudo limpo" sem ter lido nada. */
ok(
  `a varredura extraiu texto de tela para examinar (${Math.round(examinados / 1000)} mil caracteres)`,
  examinados > 50000,
  "checagem negativa que não examinou nada é checagem que não roda"
);
ok(
  "nenhum termo de desenvolvedor aparece em texto de tela",
  infratores.length === 0,
  infratores.join(" · ")
);

/* ── A página órfã de deploy não voltou ────────────────────────────────── */

ok(
  "app/instalar/ não existe mais",
  !existsSync(root("app", "instalar")),
  "era doc de deploy servida publicamente, sem link nenhum apontando para ela"
);
/* Lado OPOSTO: o conteúdo não se perdeu — DEPLOY.md continua e cobre mais. */
ok(
  "…e o DEPLOY.md continua sendo a fonte do assunto",
  existsSync(root("DEPLOY.md")) &&
    /docker/i.test(readFileSync(root("DEPLOY.md"), "utf8")) &&
    /SESSION_SECRET/.test(readFileSync(root("DEPLOY.md"), "utf8")),
  "apagar a página só é seguro porque a documentação de verdade existe"
);

/* ── A tela de mesa não encontrada fala com o usuário ──────────────────── */

const MESA = readFileSync(root("app", "mesa", "[roomId]", "page.tsx"), "utf8");
ok(
  "a tela de mesa inexistente explica o que houve, em linguagem de usuário",
  /não existe mais, ou o link de convite expirou/.test(MESA) &&
    /Peça um convite novo ao Mestre/.test(MESA)
);

console.log(`\nverify-sem-texto-dev: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
