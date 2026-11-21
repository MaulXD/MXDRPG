/**
 * P-16: o Um Anel recarregava as fichas (lista do card e ficha aberta) a cada mensagem
 * do chat, porque os dois painéis usavam a revisão bruta da sala, que sobe com qualquer
 * gravação, inclusive mensagem.
 *
 * Correção: o MesaRoomStore ganha uma revisão de dados (slice "data") que:
 *   - NÃO sobe quando a única mudança é chat novo;
 *   - SOBE quando alguma fatia que não é chat mudou (ator, cena, combate, etc.);
 *   - SOBE quando a revisão mudou sem chat (ex.: ficha do Um Anel gravada fora da sala).
 * Os dois painéis passam a usar useMesaRoomDataRevision.
 *
 * Teste comportamental: compila mesa-room-store.ts com o TypeScript (só tipos no
 * arquivo, então a saída não tem imports) e exercita o store com snapshots reais.
 * Teste estático: confere a ligação do hook e dos dois painéis.
 *
 * node scripts/verify-p16-tor-sem-chat.mjs
 */
import { readFileSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);
const read = (p) => readFileSync(root(p), "utf8");

let failures = 0;
function check(name, ok, detail = "") {
  if (ok) console.log(`ok  - ${name}`);
  else {
    failures += 1;
    console.log(`FAIL - ${name}${detail ? `: ${detail}` : ""}`);
  }
}

// ---------- comportamento do store ----------
const storeSrc = read("hooks/vtt/mesa-room-store.ts");
const compiled = ts.transpileModule(storeSrc, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const dir = mkdtempSync(join(tmpdir(), "p16-store-"));
const storeFile = join(dir, "mesa-room-store.mjs");
writeFileSync(storeFile, compiled, "utf8");
const { MesaRoomStore } = await import(pathToFileURL(storeFile).href);

// Snapshot base: as fatias são referências FIXAS (mesmo objeto em todo snapshot), como no
// sync real, em que uma gravação de chat não recria settings/scene/actors/combat. Cada
// teste troca só o que muda. Sem isso, o teste não distingue "chat" de "fatia nova".
const SETTINGS = { gm: "a" };
const SCENE = { id: "s" };
const ACTORS = { a1: { id: "a1", hp: 5 } };
const COMBAT = { round: 1 };
const PINGS = [];
const CHAT0 = [{ id: "m1", text: "oi" }];
function baseSnapshot(overrides = {}) {
  const base = {
    roomId: "r1",
    revision: 10,
    settings: SETTINGS,
    scene: SCENE,
    actors: ACTORS,
    combat: COMBAT,
    pings: PINGS,
    chat: CHAT0,
  };
  return { ...base, ...overrides };
}

function newStore() {
  const store = new MesaRoomStore();
  let dataHits = 0;
  let revisionHits = 0;
  let chatHits = 0;
  store.subscribe("data", () => (dataHits += 1));
  store.subscribe("revision", () => (revisionHits += 1));
  store.subscribe("chat", () => (chatHits += 1));
  return {
    store,
    counts: () => ({ data: dataHits, revision: revisionHits, chat: chatHits }),
  };
}

// 1) Carga inicial sobe a revisão de dados.
{
  const { store, counts } = newStore();
  const start = store.getDataRevision();
  store.patchSync({ snapshot: baseSnapshot(), loading: false });
  check("carga inicial sobe a revisão de dados", store.getDataRevision() > start);
  check("carga inicial emite o slice data", counts().data >= 1);
}

// 2) Só chat novo: revisão de dados NÃO sobe; chat e revisão bruta sobem.
{
  const { store, counts } = newStore();
  const s1 = baseSnapshot();
  store.patchSync({ snapshot: s1, loading: false });
  const before = store.getDataRevision();
  const dataBefore = counts().data;
  const chatBefore = counts().chat;
  const revBefore = counts().revision;
  const s2 = baseSnapshot({
    revision: 11,
    chat: [...s1.chat, { id: "m2", kind: "roll", fromChatBox: true, text: "rolei 20" }],
  });
  store.patchSync({ snapshot: s2 });
  check("chat novo não sobe a revisão de dados", store.getDataRevision() === before);
  check("chat novo não emite o slice data", counts().data === dataBefore);
  check("chat novo emite o slice chat", counts().chat === chatBefore + 1);
  check("revisão bruta continua subindo com chat", counts().revision === revBefore + 1);
}

// 3) Ator mudou (com chat novo na mesma gravação): revisão de dados sobe.
{
  const { store } = newStore();
  const s1 = baseSnapshot();
  store.patchSync({ snapshot: s1, loading: false });
  const before = store.getDataRevision();
  const s2 = baseSnapshot({
    revision: 11,
    chat: [...s1.chat, { id: "m2", text: "ataque" }],
    actors: { a1: { id: "a1", hp: 3 } },
  });
  store.patchSync({ snapshot: s2 });
  check("ator mudado sobe a revisão de dados", store.getDataRevision() > before);
}

// 4) Só revisão nova, sem chat e sem fatia mudada (ficha do Um Anel fora da sala): sobe.
{
  const { store } = newStore();
  const s1 = baseSnapshot();
  store.patchSync({ snapshot: s1, loading: false });
  const before = store.getDataRevision();
  const s2 = baseSnapshot({ revision: 11 });
  store.patchSync({ snapshot: s2 });
  check("revisão nova sem chat e sem fatia sobe a revisão de dados", store.getDataRevision() > before);
}

// 4b) Gravação de ficha fora da sala narrada no chat no MESMO sync: sobe. Avanço,
// recuperação, fadiga, Olho e Sombra narram com kind "chat" (Lupa, P-16): o que conta é
// a mensagem NÃO ter vindo da caixa do chat (sem fromChatBox).
for (const kind of ["system", "combat", "chat", "roll"]) {
  const { store } = newStore();
  const s1 = baseSnapshot();
  store.patchSync({ snapshot: s1, loading: false });
  const before = store.getDataRevision();
  const s2 = baseSnapshot({
    revision: 11,
    chat: [...s1.chat, { id: "x1", kind, text: "Aragorn ganhou 2 Pontos de Aventura" }],
  });
  store.patchSync({ snapshot: s2 });
  check(`chat novo de ${kind} (gravação narrada) sobe a revisão de dados`, store.getDataRevision() > before);
}
{
  const { store } = newStore();
  const s1 = baseSnapshot();
  store.patchSync({ snapshot: s1, loading: false });
  const before = store.getDataRevision();
  const s2 = baseSnapshot({
    revision: 12, // duas gravações (rolagem e mensagem): +2
    chat: [...s1.chat, { id: "r1", kind: "roll", fromChatBox: true, text: "1d20" }, { id: "c1", kind: "chat", fromChatBox: true, text: "oi" }],
  });
  store.patchSync({ snapshot: s2 });
  check("chat e rolagem comuns não sobem a revisão de dados", store.getDataRevision() === before);
}

// 5) Mesmo objeto de snapshot: nada muda.
{
  const { store } = newStore();
  const s1 = baseSnapshot();
  store.patchSync({ snapshot: s1, loading: false });
  const before = store.getDataRevision();
  store.patchSync({ snapshot: s1 });
  check("mesmo snapshot não sobe a revisão de dados", store.getDataRevision() === before);
}

// 6) Sequência de mensagens de chat: nenhuma sobe a revisão de dados.
{
  const { store } = newStore();
  let snap = baseSnapshot();
  store.patchSync({ snapshot: snap, loading: false });
  const before = store.getDataRevision();
  for (let i = 0; i < 5; i += 1) {
    snap = baseSnapshot({
      revision: snap.revision + 1,
      chat: [...snap.chat, { id: `c${i}`, kind: "chat", fromChatBox: true, text: `msg ${i}` }],
      actors: snap.actors,
      settings: snap.settings,
      scene: snap.scene,
      combat: snap.combat,
    });
    store.patchSync({ snapshot: snap });
  }
  check("cinco mensagens seguidas não sobem a revisão de dados", store.getDataRevision() === before);
}

// ---------- ligação do hook e dos dois painéis ----------
const hookSrc = read("hooks/vtt/useMesaRoomSlice.ts");
check(
  "useMesaRoomDataRevision assina o slice data",
  /export function useMesaRoomDataRevision[\s\S]*?subscribe\("data"/.test(hookSrc)
);

const playable = read("components/vtt/TorPlayableCharactersPanel.tsx");
const popup = read("components/vtt/TorCharacterSheetPopup.tsx");
for (const [name, src] of [
  ["TorPlayableCharactersPanel", playable],
  ["TorCharacterSheetPopup", popup],
]) {
  check(`${name} usa useMesaRoomDataRevision`, /useMesaRoomDataRevision\(/.test(src));
  check(`${name} não usa mais useMesaRoomRevision`, !/useMesaRoomRevision/.test(src));
}
check(
  "debounce de 600 ms mantido no card",
  /setTimeout\(\(\) => setReloadKey\(\(k\) => k \+ 1\), 600\)/.test(playable)
);
check("debounce de 600 ms mantido na ficha", /setTimeout\(\(\) => void load\(characterId\), 600\)/.test(popup));

if (failures > 0) {
  console.error(`\n${failures} verificação(ões) falharam`);
  process.exit(1);
}
console.log("\nverify-p16-tor-sem-chat: todas as verificações passaram");

// P-16 (Lupa): só a rota do chat marca fromChatBox, e o append guarda a marca.
{
  const { readFileSync: ler16 } = await import("node:fs");
  const rota = ler16(new URL("../app/api/room/[roomId]/chat/route.ts", import.meta.url), "utf8");
  const marcas = rota.match(/fromChatBox: true,/g) ?? [];
  if (marcas.length !== 2) throw new Error(`rota do chat deve marcar mensagem e rolagem (achei ${marcas.length})`);
  const append = ler16(new URL("../lib/room/handlers/chat.ts", import.meta.url), "utf8");
  if (!/message\.fromChatBox \? \{ fromChatBox: true as const \}/.test(append)) {
    throw new Error("appendRoomChatMessage nao guarda fromChatBox");
  }
  const handlers = ["tor-advance", "tor-recovery", "tor-fatigue", "tor-eye", "tor-shadow"];
  for (const h of handlers) {
    const src = ler16(new URL(`../lib/room/handlers/${h}.ts`, import.meta.url), "utf8");
    if (/fromChatBox/.test(src)) throw new Error(`${h} nao pode marcar fromChatBox (narração de gravação)`);
  }
  console.log("ok  - só a caixa do chat marca fromChatBox; as gravações do Um Anel não");
}

// P-16 (Lupa, 2a): ping junto com ficha gravada fora da sala (só revisão) e ping junto
// com gravação narrada sem marca: os dois SOBEM a revisão de dados.
{
  const { store } = newStore();
  const s1 = baseSnapshot();
  store.patchSync({ snapshot: s1, loading: false });
  const before = store.getDataRevision();
  store.patchSync({ snapshot: { ...s1, revision: 12, pings: [{ id: "p1", x: 1, y: 1 }] } });
  if (!(store.getDataRevision() > before)) throw new Error("ping + ficha gravada fora da sala não subiu a revisão de dados");
  console.log("ok  - ping junto com revisão nova (ficha fora da sala) sobe a revisão de dados");
}
{
  const { store } = newStore();
  const s1 = baseSnapshot();
  store.patchSync({ snapshot: s1, loading: false });
  const before = store.getDataRevision();
  store.patchSync({
    snapshot: {
      ...s1,
      revision: 13,
      pings: [{ id: "p2", x: 2, y: 2 }],
      chat: [...s1.chat, { id: "av1", kind: "chat", text: "Aragorn subiu Atletismo" }],
    },
  });
  if (!(store.getDataRevision() > before)) throw new Error("ping + gravação narrada não subiu a revisão de dados");
  console.log("ok  - ping junto com gravação narrada (kind chat, sem marca) sobe a revisão de dados");
}

// P-16 (Lupa, 3a): mensagem da caixa + ficha gravada fora da sala no MESMO sync
// (reconexão do SSE junta as duas): a revisão sobe 2 com 1 mensagem da caixa -> sobe.
{
  const { store } = newStore();
  const s1 = baseSnapshot();
  store.patchSync({ snapshot: s1, loading: false });
  const before = store.getDataRevision();
  store.patchSync({
    snapshot: {
      ...s1,
      revision: s1.revision + 2,
      chat: [...s1.chat, { id: "cx1", kind: "chat", fromChatBox: true, text: "vamos" }],
    },
  });
  if (!(store.getDataRevision() > before)) throw new Error("mensagem da caixa escondeu a ficha gravada no mesmo sync");
  console.log("ok  - mensagem da caixa + ficha gravada fora da sala no mesmo sync sobe a revisão de dados");
}
{
  const { store } = newStore();
  const s1 = baseSnapshot();
  store.patchSync({ snapshot: s1, loading: false });
  const before = store.getDataRevision();
  store.patchSync({
    snapshot: {
      ...s1,
      revision: s1.revision + 1,
      chat: [...s1.chat, { id: "cx2", kind: "chat", fromChatBox: true, text: "só conversa" }],
    },
  });
  if (store.getDataRevision() !== before) throw new Error("uma mensagem da caixa (+1 na revisão) subiu a revisão de dados");
  console.log("ok  - uma mensagem da caixa com +1 na revisão não sobe a revisão de dados");
}
