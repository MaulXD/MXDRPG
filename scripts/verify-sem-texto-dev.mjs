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

function varrer(dir, acc = [], extensao = /\.tsx$/) {
  if (!existsSync(dir)) return acc;
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) varrer(caminho, acc, extensao);
    else if (extensao.test(nome)) acc.push(caminho);
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

/* ── Mensagem de erro do servidor não cita o que é de mantenedor ───────── */

/**
 * Mensagem lançada (throw) ou devolvida em JSON de lib/ e app/api/ vai para a tela
 * do jogador quando a rota repassa `e.message`. Por isso o texto de erro não pode
 * citar comando, variável de ambiente nem arquivo local. O detalhe técnico vai
 * para console.error no servidor, não para a resposta.
 */
const PROIBIDOS_SERVIDOR = [
  ["npm run", "comando de terminal"],
  ["DATABASE_URL", "nome de variável de ambiente"],
  ["db:migrate", "comando de migration"],
  ["migrate", "comando de migration"],
  [".env", "arquivo de configuração local"],
];

/**
 * Diagnóstico de operação: /api/health e o ping do banco são lidos por quem
 * mantém o servidor, não pelo jogador. Ficam fora da varredura de propósito.
 */
const DIAGNOSTICO = new Set([
  "app/api/health/route.ts",
  "lib/db/enabled.ts",
  "lib/db/client.ts",
  "lib/db/client-mariadb.ts",
]);

/**
 * Literais de string do código, sem comentário. Um par de aspas pode pegar o trecho
 * entre dois literais vizinhos (`"1" || process.env.X === "1"`); por isso descarta o
 * que tem operador de código. Mensagem para o jogador não tem `===` nem `||`.
 */
function literaisDeCodigo(src) {
  return [...stripComments(src).matchAll(/["'`]([^"'`\n]{4,})["'`]/g)]
    .map((m) => m[1])
    .filter((t) => !/===|!==|\|\||&&|=>/.test(t))
    /* Prefixo de log "[tag] ..." é mensagem de console, não de tela. O detalhe técnico
       (DATABASE_URL etc.) fica nele de propósito. */
    .filter((t) => !/^\[[\w-]+\]/.test(t));
}

ok(
  "literaisDeCodigo pega texto de throw",
  literaisDeCodigo('throw new Error("rode npm run db:migrate");').includes("rode npm run db:migrate")
);
ok(
  "literaisDeCodigo IGNORA comentário",
  literaisDeCodigo("// npm run antigo\nconst x = 1;").length === 0
);

const servidor = [
  ...varrer(root("lib"), [], /\.tsx?$/),
  ...varrer(root("app", "api"), [], /\.tsx?$/),
].filter((caminho) => !DIAGNOSTICO.has(rel(caminho)));
ok(`varreu lib/ e app/api/ (${servidor.length} arquivos)`, servidor.length > 100);

const infratoresServidor = [];
let literaisExaminados = 0;
for (const caminho of servidor) {
  const literais = literaisDeCodigo(readFileSync(caminho, "utf8"));
  literaisExaminados += literais.length;
  for (const literal of literais) {
    for (const [termo, porque] of PROIBIDOS_SERVIDOR) {
      if (literal.includes(termo)) {
        infratoresServidor.push(`${rel(caminho)} → "${termo}" (${porque}): ${literal.slice(0, 70)}`);
      }
    }
  }
}
/* Mesma regra da checagem de tela: sem literais examinados, "tudo limpo" não diz nada. */
ok(
  `a varredura extraiu literais de código para examinar (${literaisExaminados})`,
  literaisExaminados > 500,
  "checagem negativa que não examinou nada é checagem que não roda"
);
ok(
  "nenhum erro de servidor chega ao jogador citando comando ou variável de ambiente",
  infratoresServidor.length === 0,
  infratoresServidor.join(" · ")
);

/* ── N-02b: /entrar e recuperação de senha falam com o jogador ─────────── */

const FRASES_ANTIGAS = ["exigem MariaDB no servidor", "requer banco MariaDB em produção"];
const FRASE_ENTRAR = "E-mail e senha. Novos cadastros estão indisponíveis no momento.";
const FRASE_RECUPERAR = "Esta conta ainda não tem recuperação de senha. Fale com o suporte para ativá-la.";

const AUTH_CAP = readFileSync(root("lib", "auth", "auth-capabilities.ts"), "utf8");
const RECOVER = readFileSync(root("lib", "auth", "password-recover.ts"), "utf8");

// D-14: a segunda frase virou a constante FRASE_CADASTRO_INDISPONIVEL (usada também pela rota de cadastro).
ok(
  "/entrar mostra a frase nova para jogador",
  AUTH_CAP.includes(FRASE_ENTRAR) ||
    (AUTH_CAP.includes('FRASE_CADASTRO_INDISPONIVEL = "Novos cadastros estão indisponíveis no momento."') &&
      AUTH_CAP.includes("`E-mail e senha. ${FRASE_CADASTRO_INDISPONIVEL}`"))
);
ok("recuperação de senha mostra a frase nova para jogador", RECOVER.includes(FRASE_RECUPERAR));
ok(
  "as duas frases novas não citam banco, comando nem variável",
  ![FRASE_ENTRAR, FRASE_RECUPERAR].some((f) => /MariaDB|banco|npm run|DATABASE_URL|\.env/.test(f))
);

/* N-02b r2: /entrar não pode voltar a dizer "servidor sem banco" nem contradizer a frase de authLoginLead. */
const PAGINA_ENTRAR = readFileSync(root("app", "entrar", "page.tsx"), "utf8");
const TELA_ENTRAR = textoDeTela(PAGINA_ENTRAR);
ok(
  "app/entrar/page.tsx sem termo técnico (banco, container, MariaDB) no texto de tela",
  !/sem banco|container|MariaDB|banco/i.test(TELA_ENTRAR),
  TELA_ENTRAR.slice(0, 120)
);
ok(
  "app/entrar/page.tsx não contradiz 'Novos cadastros estão indisponíveis' com 'cadastro com e-mail funciona'",
  !/cadastro com e-mail funciona/i.test(PAGINA_ENTRAR)
);
ok(
  "app/entrar/page.tsx continua usando authLoginLead (frase de cadastro única)",
  PAGINA_ENTRAR.includes("authLoginLead(auth)")
);

/* N-02b r3: a aba Criar conta e o formulário de cadastro não podem falar de banco nem contradizer
   "Novos cadastros estão indisponíveis". A aba fica atrás de podeCadastrar (sem contas persistentes, some). */
const TELAS_AUTH = ["components/auth/AuthTabs.tsx", "components/auth/RegisterForm.tsx", "components/auth/LoginForm.tsx"];
for (const alvo of TELAS_AUTH) {
  const src = readFileSync(root(...alvo.split("/")), "utf8");
  const tela = textoDeTela(src);
  ok(
    `${alvo} sem termo técnico (banco de dados, MariaDB, container, servidor)`,
    !/banco de dados|sem banco|MariaDB|container|servidor está|servidor esta/i.test(tela),
    tela.slice(0, 120)
  );
  ok(
    `${alvo} não contradiz 'Novos cadastros estão indisponíveis'`,
    !/cadastro com e-mail funciona|pode sumir se o site reiniciar/i.test(src)
  );
}
const AUTH_TABS = readFileSync(root("components", "auth", "AuthTabs.tsx"), "utf8");
const inicioCondicao = AUTH_TABS.indexOf("{podeCadastrar ? (");
const fimCondicao = AUTH_TABS.indexOf(") : null}", inicioCondicao);
const posCriar = AUTH_TABS.indexOf("Criar conta", inicioCondicao);
ok(
  "AuthTabs: a aba Criar conta só aparece com podeCadastrar (sem contas persistentes, some)",
  inicioCondicao >= 0 && posCriar > inicioCondicao && posCriar < fimCondicao,
  "a aba precisa estar dentro de {podeCadastrar ? ( ... ) : null}"
);
ok(
  "AuthTabs: sem cadastro, o formulário de cadastro não é renderizado",
  /tabAtiva === "login"\s*\?\s*\(\s*<LoginForm/.test(AUTH_TABS)
);

/* Negativa: as frases antigas não podem estar em nenhum arquivo de tela ou de servidor. */
const CODIGO_AUTH = [
  ...varrer(root("app"), [], /\.tsx?$/),
  ...varrer(root("components"), [], /\.tsx?$/),
  ...varrer(root("lib"), [], /\.tsx?$/),
];
const antigasAindaAqui = CODIGO_AUTH.filter((c) => {
  const src = readFileSync(c, "utf8");
  return FRASES_ANTIGAS.some((f) => src.includes(f));
}).map(rel);
ok(
  "as frases antigas de /entrar e recuperação sumiram do código",
  antigasAindaAqui.length === 0,
  antigasAindaAqui.join(" · ")
);

console.log(`\nverify-sem-texto-dev: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
