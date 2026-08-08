/**
 * A Sombra chega à mesa.
 *
 * Por que existe: `lib/combat/um-anel/shadow.ts` estava completo e testado desde
 * cedo — e **nada o chamava**. Uma auditoria de cobertura mostrou que 6 das 9
 * funções exportadas não tinham consumidor nenhum, e que `applyTorShadowGain` só
 * era referenciada dentro de `progression.ts`, que também não chegava à mesa.
 *
 * O efeito prático era grave e silencioso: a Sombra só mudava se alguém editasse
 * a ficha na mão, e por isso as duas condições que o combate consulta a cada
 * rolagem — **Arrasado** (o Olho vira falha automática) e **Desfavorecido**
 * (dois Dados de Proeza, fica o pior) — não tinham gatilho.
 *
 * `scripts/verify-um-anel-shadow.mjs` continua conferindo o MOTOR. Este confere
 * o CAMINHO: ficha → handler → rota → painel.
 *
 * Fonte: livros/um-anel/compendio/sombra.md e o capítulo da Sombra.
 */
import { readFileSync as rawReadFileSync, existsSync, readdirSync } from "fs";

/* Normaliza CRLF -> LF na leitura: âncoras de linha não devem depender de fim
   de linha (no Windows um clone novo entrega CRLF). */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const SHADOW = readFileSync(root("lib", "combat", "um-anel", "shadow.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-shadow.ts"), "utf8");
const PANEL = readFileSync(root("components", "vtt", "TorShadowPanel.tsx"), "utf8");
const STATUS = readFileSync(root("components", "vtt", "TokenStatusBody.tsx"), "utf8");
const SYNC = readFileSync(root("hooks", "useRoomSync.ts"), "utf8");
const ROUTE_PATH = root("app", "api", "room", "[roomId]", "tor-shadow", "route.ts");

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

console.log("verify-um-anel-sombra-mesa: o motor de Sombra tem consumidor real");

/* ── 1. As funções centrais deixaram de ser código morto ───────────────── */

const handlerCode = stripComments(HANDLER);
for (const fn of ["applyTorShadowGain", "hardenTorWill", "formatTorShadowGainMessage"]) {
  ok(`${fn} é chamada pelo handler`, new RegExp(`\\b${fn}\\(`).test(handlerCode), "seguia sem consumidor");
}

/* ── 2. Quem pode o quê ────────────────────────────────────────────────── */

/* Ganhar Sombra é do Mestre (ele narra o Pavor e julga o Malfeito); Endurecer a
   Vontade é de quem joga o herói. As duas ações na mesma rota, com donos
   diferentes — por isso a separação mora no handler, não na rota. */
ok(
  "só o Mestre atribui Sombra",
  /if \(action\.kind === "gain" && !isGm\) return \{ ok: false, error: "Só o Mestre atribui Sombra" \}/.test(
    handlerCode
  )
);
ok(
  "Endurecer a Vontade é do dono da ficha (ou do Mestre)",
  /if \(action\.kind === "harden" && !isGm && !isOwner\)/.test(handlerCode)
);
ok(
  "rota não exige requireRoomManage",
  existsSync(ROUTE_PATH) && !/requireRoomManage/.test(stripComments(readFileSync(ROUTE_PATH, "utf8"))),
  "as duas ações têm donos diferentes"
);
ok(
  "rota usa apelido como autor",
  existsSync(ROUTE_PATH) &&
    /authorName: session\.user\.nickname\?\.trim\(\) \|\| "Jogador"/.test(readFileSync(ROUTE_PATH, "utf8"))
);
ok("recusa mesa que não seja do Um Anel", /rpgSystemId !== "um-anel"/.test(handlerCode));
ok(
  "só herói tem Sombra",
  /combat\?\.kind !== "hero" \|\| !combat\.torCharacterId/.test(handlerCode),
  "adversário usa Ódio/Resolução, não Sombra"
);

/* ── 3. Entradas recortadas ────────────────────────────────────────────── */

ok(
  "fonte de Sombra é validada contra a lista do livro",
  /TOR_SHADOW_SOURCES as readonly string\[\]\)\.includes\(v\)/.test(handlerCode),
  "corpo da requisição não é confiável"
);
ok("pontos são limitados", /Math\.max\(0, Math\.min\(10, Math\.floor\(action\.points\)\)\)/.test(handlerCode));
ok("cicatrizes são limitadas", /Math\.max\(0, Math\.min\(4, Math\.floor\(action\.scars \?\? 0\)\)\)/.test(handlerCode));

/* ── 4. O estado montado a partir da ficha ─────────────────────────────── */

/* `load` do TorSpiritState é a Carga do EQUIPAMENTO, sem a Fadiga — quem soma as
   duas é `totalTorLoad`, dentro do motor. Passar a Carga já somada contaria a
   Fadiga duas vezes e deixaria heróis Exaustos cedo demais. */
ok(
  "Carga vem recalculada do equipamento, sem a Fadiga",
  /load: computeLoad\(sheet\.warGear, sheet\.armour, sheet\.culture\)/.test(handlerCode),
  "somar a Fadiga aqui a contaria duas vezes"
);
ok("Fadiga entra em campo próprio", /fatigue: sheet\.fatigue/.test(handlerCode));
ok("motor soma Carga + Fadiga por conta própria", /export function totalTorLoad/.test(SHADOW));

/* ── 5. Persistência ───────────────────────────────────────────────────── */

ok(
  "Sombra e Cicatrizes voltam pra ficha",
  /patchTorCharacterResources\(sheet\.id, \{ shadow, shadowScars \}/.test(handlerCode),
  "sem gravar, a Sombra sumiria no próximo carregamento"
);
/* Se a gravação falhar, não pode anunciar no chat que a Sombra subiu. */
/* Ancorado na CHAMADA (`patchTorCharacterResources(sheet.id`), não no nome: o
   nome também aparece na linha de `import`, no topo do arquivo, e comparar com
   ela faria a asserção passar sempre — foi o que aconteceu na primeira versão. */
const gravacaoIdx = handlerCode.indexOf("patchTorCharacterResources(sheet.id");
const chatIdx = handlerCode.indexOf("appendRoomChatMessage(room");
ok(
  "só anuncia depois de gravar",
  gravacaoIdx >= 0 && chatIdx > gravacaoIdx,
  "anunciar antes deixaria a mesa achando que subiu quando não subiu"
);

/* ── 6. UI ─────────────────────────────────────────────────────────────── */

ok("painel de Sombra existe", PANEL.length > 0);
ok("painel aparece no token do herói", /<TorShadowPanel/.test(STATUS));
ok(
  "painel lista as quatro fontes do livro",
  /TOR_SHADOW_SOURCES\.map/.test(PANEL) && /TOR_SHADOW_SOURCE_META\[s\]\.label/.test(PANEL)
);
/* Malfeito é a única fonte que o Teste de Sombra não reduz — quem atribui
   precisa ver isso ANTES de informar os pontos. */
ok(
  "painel avisa que Malfeito não é resistível",
  /Malfeito não pode ser reduzido nem cancelado por Teste de Sombra/.test(PANEL)
);
ok(
  "atribuir Sombra só aparece pro Mestre",
  /\{canManage \? \(/.test(PANEL),
  "jogador não distribui a própria Sombra"
);
ok("Endurecer a Vontade aparece pro jogador", /Endurecer a Vontade/.test(PANEL));
ok("existe helper de cliente", /postRoomTorShadow/.test(SYNC));
ok(
  "UI sem emoji",
  !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(PANEL),
  "convenção do projeto: ícones só em SVG"
);

/* ── 7. O que segue sem consumidor, registrado ─────────────────────────── */

/**
 * A auditoria achou mais motor desligado do que esta rodada consegue ligar. O
 * que segue sem consumidor está listado aqui de propósito: quando alguém ligar,
 * a asserção falha e obriga a mexer nesta lista — que é o registro de dívida.
 */
const AINDA_SEM_CONSUMIDOR = ["applyTorJourneyEndRecovery"];

/**
 * A varredura tem de ser AMPLA. A primeira versão desta checagem olhava uma
 * lista fixa de arquivos, e quando as funções foram ligadas num handler novo
 * (`tor-recovery.ts`) ela **não acusou** — a dívida seguiu "registrada" depois
 * de paga. Mesmo defeito que este teste existe para evitar: a asserção provava
 * um texto, não um fato.
 */
function consumidoresDoProjeto() {
  const dirs = [root("lib", "room", "handlers"), root("components", "vtt"), root("lib", "combat", "um-anel")];
  const out = [];
  for (const dir of dirs) {
    for (const f of readdirSync(dir)) {
      if (!/\.(ts|tsx)$/.test(f)) continue;
      // O próprio shadow.ts não conta: nele as funções são DEFINIDAS.
      if (f === "shadow.ts") continue;
      out.push(stripComments(readFileSync(join(dir, f), "utf8")));
    }
  }
  return out;
}
const CONSUMIDORES = consumidoresDoProjeto();

/* O lado positivo: as que foram ligadas precisam TER consumidor. Sem isto, a
   lista poderia esvaziar por engano e ninguém notaria. */
for (const fn of ["applyTorBoutOfMadness", "applyTorProlongedRest", "healTorShadowScar"]) {
  ok(
    `${fn} tem consumidor real`,
    CONSUMIDORES.some((src) => new RegExp(`\\b${fn}\\(`).test(src)),
    "saiu da lista de dívida mas ninguém chama"
  );
}
for (const fn of AINDA_SEM_CONSUMIDOR) {
  const usada = CONSUMIDORES.some((src) => new RegExp(`\\b${fn}\\(`).test(src));
  ok(
    `${fn} segue sem consumidor (dívida registrada)`,
    !usada,
    "ligou? então atualize a lista deste teste"
  );
}

console.log(`\n  ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
