/**
 * O nome real da conta nunca sai para outro usuário — só o apelido.
 *
 * REGRA DO PROJETO: `user.name` é o nome real cadastrado. Ele pode aparecer nas
 * superfícies do próprio dono (perfil, conta) e no admin, e em lugar nenhum mais.
 * O que trafega para os outros participantes é o apelido:
 *
 *     session.user.nickname?.trim() || "Jogador"
 *
 * ISSO JÁ VAZOU TRÊS VEZES neste repositório — no chat e nos logs de combate
 * (2026-07-29), no perfil/amigos/membros (2026-07-29), e nos fallbacks
 * (2026-07-31). Voltou uma quarta: quatro handlers de Mestre gravavam
 * `authorName: user?.name ?? "Mestre"` no snapshot da sala, que é distribuído a
 * TODOS os participantes.
 *
 * Por isso a varredura é por DIRETÓRIO e não por lista de arquivos. Lista fixa já
 * falhou duas vezes aqui: o arquivo novo simplesmente não estava nela. Um handler
 * criado amanhã com o padrão errado quebra este teste sem ninguém lembrar de
 * atualizá-lo.
 */
import { readFileSync as rawReadFileSync, readdirSync, statSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname, relative } from "path";
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

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/** Todo .ts/.tsx sob um diretório, recursivo. */
function varrer(dir, acc = []) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) varrer(caminho, acc);
    else if (/\.tsx?$/.test(nome)) acc.push(caminho);
  }
  return acc;
}

console.log("verify-privacidade-apelido: nome real nunca sai para outro usuário");

/* ── 1. Onde o nome NÃO pode ser usado como identidade pública ─────────── */

/* Dois diretórios: os handlers (que escrevem no snapshot da sala) e as rotas de
   API (que montam o payload). São os dois caminhos por onde o nome já vazou. */
const ALVOS = [root("lib", "room", "handlers"), root("app", "api")];
const arquivos = ALVOS.flatMap((d) => varrer(d));
ok(`varreu os diretórios de sala e API (${arquivos.length} arquivos)`, arquivos.length > 50);

/* O padrão proibido é o nome REAL virando nome de autor/exibição. Não banimos
   `user.name` em geral: ele é legítimo em tela de perfil e no admin. O que se
   proíbe é ele preencher um campo que viaja para os outros. */
const CAMPOS_PUBLICOS = "authorName|displayName|senderName|actorName|playerName|memberName";
const PROIBIDO = new RegExp(
  `(${CAMPOS_PUBLICOS})\\s*:\\s*[^,;\\n]*\\b(?:session\\s*\\.\\s*)?user\\s*\\??\\s*\\.\\s*name\\b`
);

const infratores = [];
for (const caminho of arquivos) {
  const src = stripComments(readFileSync(caminho, "utf8"));
  if (PROIBIDO.test(src)) {
    const linha = src.split("\n").findIndex((l) => PROIBIDO.test(l)) + 1;
    infratores.push(`${relative(root(), caminho).replace(/\\/g, "/")}:${linha}`);
  }
}
ok(
  "nenhum campo público de nome é preenchido com o nome real da conta",
  infratores.length === 0,
  infratores.join(" · ")
);

/* ── 2. A guarda tem de PEGAR o padrão errado ──────────────────────────── */

/* Uma varredura negativa passa trivialmente se o regex estiver quebrado. Estes
   dois casos provam que ele acusa o que deve acusar e ignora o que deve ignorar
   — sem isso a asserção acima seria decorativa. */
ok(
  "a guarda reconhece o padrão que vazou de verdade",
  PROIBIDO.test('authorName: user?.name ?? "Mestre",') &&
    PROIBIDO.test('displayName: session.user.name,')
);
ok(
  "…e não acusa o padrão correto",
  !PROIBIDO.test('authorName: user?.nickname?.trim() || "Mestre",') &&
    !PROIBIDO.test('authorName: session.user.nickname?.trim() || "Jogador",')
);
ok(
  "…nem acusa uso legítimo do nome fora de campo público",
  !PROIBIDO.test("const label = user.name;") && !PROIBIDO.test("<h1>{user.name}</h1>")
);

/* ── 3. O padrão CERTO está mesmo em uso ───────────────────────────────── */

/* Lado oposto da mudança: se alguém apagar os quatro `nickname` em vez de
   consertá-los, a checagem negativa acima passa e esta aqui quebra. */
const HANDLERS = varrer(root("lib", "room", "handlers"));
const comApelido = HANDLERS.filter((c) =>
  /authorName\s*:\s*[^,;\n]*nickname/.test(stripComments(readFileSync(c, "utf8")))
);
ok(
  `handlers usam o apelido como autor (${comApelido.length})`,
  comApelido.length >= 4,
  "os quatro handlers de Mestre que vazavam o nome real"
);

/* E o fallback nunca pode ser vazio: apelido em branco cairia no nome real de
   novo em qualquer lugar que faça `|| user.name`. */
const semFallback = comApelido.filter(
  (c) => !/nickname\s*\??\.\s*trim\(\)\s*\|\|\s*"/.test(stripComments(readFileSync(c, "utf8")))
);
ok(
  "todo apelido tem fallback literal, não cai de volta no nome",
  semFallback.length === 0,
  semFallback.map((c) => relative(root(), c).replace(/\\/g, "/")).join(" · ")
);

console.log(`\nverify-privacidade-apelido: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
