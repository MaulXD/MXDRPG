/**
 * P-12 (desempenho): pedidos repetidos na mesa parada e ao mandar uma mensagem.
 *
 * (1) RoomChat: o POST /api/room/[id]/chat ja devolve o snapshot. Antes, o chat chamava onUpdate()
 *     (refresh = GET da sala inteira) e descartava o snapshot; o SSE ainda puxava outro GET.
 *     Agora o snapshot do POST e aplicado por applyRoomResponse, e o refresh so cai se nao vier payload.
 *     Mesmo para o rolamento do DiceRoller (kind roll).
 * (2) FriendsChatProvider: nao busca /api/auth/me quando initialUserId veio do servidor.
 * (3) Os pollings de notificacoes e de pedidos da topbar da mesa (bells) pausam com a aba escondida
 *     e leem ao voltar. Pelo codigo, os intervalos vivem nos hooks e no NotificationsProvider; a topbar
 *     so monta os bells (components/vtt/mesa/MesaFoundryStageHeader.tsx).
 *
 * Teste: leitura de codigo nos pontos acima e comportamento do helper startVisiblePoll
 * (hooks/usePollWhenVisible.ts), transpilado com typescript e rodado com window/document falsos.
 *
 * node scripts/verify-p12-pedidos-repetidos.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFileSync(join(ROOT, rel), "utf8");
const require = createRequire(import.meta.url);

let passos = 0;
const ok = (nome) => {
  passos += 1;
  console.log(`ok ${passos}: ${nome}`);
};

// 1. RoomChat aplica o retorno do POST e so chama onUpdate sem payload.
const roomChat = ler("components/vtt/RoomChat.tsx");
assert.match(roomChat, /onApplyResponse\?: \(payload: RoomApiPayload\) => void/, "RoomChat precisa da prop onApplyResponse");
const envio = roomChat.match(/const send = useCallback\([\s\S]*?\}, \[text, busy[^\]]*\]\);/)?.[0] ?? "";
assert.ok(envio, "nao achei o send() do RoomChat");
assert.match(envio, /const snap = await postRoomChat\(/, "send() precisa guardar o retorno do POST");
assert.match(
  envio,
  /if \(onApplyResponse && snap && typeof snap === "object" && "revision" in snap\) \{\s*onApplyResponse\(snap\);\s*\} else \{\s*onUpdate\(\);\s*\}/,
  "send() deve aplicar o snapshot e cair em onUpdate() so sem payload"
);
assert.doesNotMatch(envio, /\n\s*onUpdate\(\);\s*\n\s*\} finally/, "onUpdate() nao pode ser incondicional apos o POST");
// Pedido da Lupa: onUpdate() aparece UMA vez no send(), e so dentro do else.
assert.equal((envio.match(/onUpdate\(\)/g) ?? []).length, 1, "send() deve chamar onUpdate() so uma vez (no else)");
ok("RoomChat aplica o snapshot do POST e so chama refresh sem payload");

const painel = ler("components/vtt/mesa/MesaRoomChatPanel.tsx");
assert.match(painel, /const \{ refresh, applyRoomResponse \} = useMesaSyncActions\(\);/, "painel precisa de applyRoomResponse");
assert.match(painel, /onApplyResponse=\{applyRoomResponse\}/, "painel precisa passar onApplyResponse ao RoomChat");
ok("MesaRoomChatPanel passa applyRoomResponse pela mesma cadeia do onUpdate");

// 1b. Rolamento (kind roll) no DiceRoller.
const dice = ler("components/vtt/DiceRoller.tsx");
assert.match(dice, /useMesaSyncActions\(\)/, "DiceRoller precisa de applyRoomResponse");
assert.match(
  dice,
  /if \(snapshot && typeof snapshot === "object" && "revision" in snapshot\) \{\s*applyRoomResponse\(snapshot\);\s*\} else \{\s*onUpdate\(\);\s*\}/,
  "DiceRoller deve aplicar o snapshot do rolamento e cair em onUpdate() so sem payload"
);
assert.equal((dice.match(/onUpdate\(\)/g) ?? []).length, 1, "DiceRoller deve chamar onUpdate() so uma vez (no else)");
ok("DiceRoller aplica o snapshot do rolamento");

// 2. FriendsChatProvider: sem initialUserId, busca; com ele, nao busca /api/auth/me.
const provider = ler("components/friends/FriendsChatProvider.tsx");
assert.match(
  provider,
  /if \(initialUserId\) \{\s*setReady\(true\);\s*\} else \{[\s\S]*?fetch\("\/api\/auth\/me", fetchOpts\)/,
  "auth/me so pode ser buscado quando initialUserId nao veio do servidor"
);
ok("FriendsChatProvider pula /api/auth/me quando initialUserId existe");

// 3. Pollings da topbar: todos passam pelo helper que pausa com a aba escondida.
const helperRel = "hooks/usePollWhenVisible.ts";
const helperSrc = ler(helperRel);
assert.match(helperSrc, /export function startVisiblePoll\(run: \(\) => void, ms: number\): \(\) => void/, "helper precisa exportar startVisiblePoll");
assert.match(helperSrc, /document\.visibilityState === "hidden"/, "helper precisa checar aba escondida");
assert.match(helperSrc, /addEventListener\("visibilitychange", onVisibility\)/, "helper precisa escutar visibilitychange");
assert.match(helperSrc, /removeEventListener\("visibilitychange", onVisibility\)/, "helper precisa remover o listener na limpeza");
ok("helper startVisiblePoll checa visibilidade e limpa o listener");

// [arquivo, usos do helper, setInterval que sobram]. O P-14 levou para o helper os
// dois setInterval que tinham sobrado (painel da ficha e usePlayerInventoryRequests).
const sitesPoll = [
  ["hooks/useSheetEditRequest.ts", 3, 0],
  ["hooks/useInventoryItemRequest.ts", 3, 0],
  ["components/notifications/NotificationsProvider.tsx", 1, 0],
];
for (const [rel, quantos, sobram] of sitesPoll) {
  const src = ler(rel);
  assert.match(src, /import \{ startVisiblePoll \} from "@\/hooks\/usePollWhenVisible";/, `${rel} precisa importar o helper`);
  const usos = src.split("return startVisiblePoll(").length - 1;
  assert.equal(usos, quantos, `${rel}: esperava ${quantos} uso(s) de startVisiblePoll, achei ${usos}`);
  const restantes = src.split("window.setInterval(").length - 1;
  assert.equal(restantes, sobram, `${rel}: esperava ${sobram} setInterval solto, achei ${restantes}`);
}
ok("pollings de notificacoes e de pedidos (bells) usam o helper com pausa");

// 3b. Comportamento do helper, transpilado e rodado com window/document falsos.
const ts = require("typescript");
const js = ts.transpileModule(helperSrc, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

function criarAmbiente() {
  const listeners = new Map();
  const intervalos = new Map();
  let nextId = 1;
  const env = {
    visibilityState: "visible",
    chamadas: 0,
    ativos: () => intervalos.size,
    window: {
      setInterval: (fn, ms) => {
        const id = nextId++;
        intervalos.set(id, { fn, ms });
        return id;
      },
      clearInterval: (id) => intervalos.delete(id),
    },
    document: {
      get visibilityState() {
        return env.visibilityState;
      },
      addEventListener: (ev, fn) => listeners.set(ev, fn),
      removeEventListener: (ev) => listeners.delete(ev),
    },
    disparar: () => listeners.get("visibilitychange")?.(),
    listeners,
  };
  return env;
}

const env = criarAmbiente();
const modulo = { exports: {} };
new Function("exports", "module", "window", "document", js)(modulo.exports, modulo, env.window, env.document);
const { startVisiblePoll } = modulo.exports;
assert.equal(typeof startVisiblePoll, "function", "helper transpilado precisa exportar startVisiblePoll");

const run = () => {
  env.chamadas += 1;
};
const parar = startVisiblePoll(run, 30_000);
assert.equal(env.ativos(), 1, "com a aba visivel, o intervalo comeca");
assert.equal(env.chamadas, 0, "o helper nao dispara a leitura ao montar (quem chama ja le)");

env.visibilityState = "hidden";
env.disparar();
assert.equal(env.ativos(), 0, "aba escondida pausa o intervalo");
assert.equal(env.chamadas, 0, "aba escondida nao faz leitura");

env.visibilityState = "visible";
env.disparar();
assert.equal(env.chamadas, 1, "ao voltar, faz uma leitura");
assert.equal(env.ativos(), 1, "ao voltar, retoma o intervalo");

env.disparar();
assert.equal(env.chamadas, 1, "evento visivel com intervalo ja ativo nao duplica leitura nem intervalo");
assert.equal(env.ativos(), 1, "nao cria segundo intervalo");

parar();
assert.equal(env.ativos(), 0, "limpeza remove o intervalo");
assert.equal(env.listeners.size, 0, "limpeza remove o listener");
ok("comportamento do helper: pausa escondida, leitura ao voltar, limpeza");

// 3c. Escondida ao montar: nao cria intervalo.
const env2 = criarAmbiente();
env2.visibilityState = "hidden";
const modulo2 = { exports: {} };
new Function("exports", "module", "window", "document", js)(modulo2.exports, modulo2, env2.window, env2.document);
const parar2 = modulo2.exports.startVisiblePoll(() => {}, 30_000);
assert.equal(env2.ativos(), 0, "aba escondida ao montar nao inicia intervalo");
parar2();
ok("aba escondida ao montar nao inicia polling");

console.log(`\nP-12: ${passos} verificacoes ok.`);
