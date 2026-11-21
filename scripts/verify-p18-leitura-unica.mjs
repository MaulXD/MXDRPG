/**
 * P-18 (desempenho): ao voltar para a aba, visibilitychange e focus disparam juntos e o
 * FriendsChatProvider lia duas vezes (/api/friends/pulse).
 *
 * Correcao: components/friends/FriendsChatProvider.tsx guarda o instante da ultima leitura
 * ao voltar (useRef) e ignora a segunda se ela chegou em menos de 2 s.
 * Intervalos (PULSE_MS = 15 s) nao mudam. hooks/usePollWhenVisible.ts so escuta
 * visibilitychange, entao nao tem o problema e nao muda.
 *
 * Teste: leitura de codigo + comportamento. O TSX e transpilado com o typescript do projeto
 * e executado com React e DOM stubados; contamos as chamadas ao pulse em cada cenario.
 *
 * node scripts/verify-p18-leitura-unica.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFileSync(join(ROOT, rel), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");

let passos = 0;
const ok = (nome) => {
  passos += 1;
  console.log(`ok ${passos}: ${nome}`);
};

// 1. Leitura de codigo.
const provider = ler("components/friends/FriendsChatProvider.tsx");
const hook = ler("hooks/usePollWhenVisible.ts");

assert.match(provider, /\buseRef\b/, "Provider precisa de useRef para guardar o instante da ultima leitura");
const janela = provider.match(/const JANELA_LEITURA_VISIVEL_MS = ([\d_]+);/);
assert.ok(janela, "falta a constante JANELA_LEITURA_VISIVEL_MS");
assert.equal(Number(janela[1].replace(/_/g, "")), 2000, "janela de leitura precisa ser 2000 ms");
assert.match(provider, /ultimaLeituraVisivelRef\.current/, "a trava precisa ler e gravar o ref");
assert.match(provider, /Date\.now\(\)/, "a trava precisa comparar com Date.now()");
ok("Provider guarda o instante da ultima leitura num ref e ignora a segunda em menos de 2 s");

const pulse = provider.match(/const PULSE_MS = ([\d_]+);/);
assert.ok(pulse, "Provider sem constante PULSE_MS");
assert.equal(Number(pulse[1].replace(/_/g, "")), 15000, "intervalo PULSE_MS nao pode mudar");
ok("intervalo de 15 s intacto");

assert.match(provider, /addEventListener\("visibilitychange"/, "Provider deixou de escutar visibilitychange");
assert.match(provider, /addEventListener\("focus"/, "Provider deixou de escutar focus");
ok("Provider continua escutando visibilitychange e focus; so a leitura dupla foi removida");

assert.match(hook, /addEventListener\("visibilitychange"/, "usePollWhenVisible deixou de escutar visibilitychange");
assert.ok(!/addEventListener\("focus"/.test(hook), "usePollWhenVisible passou a escutar focus: precisa da mesma trava");
ok("usePollWhenVisible escuta so visibilitychange, sem leitura dupla");

// 2. Comportamento: executa o Provider com React e DOM stubados.
const { outputText } = ts.transpileModule(provider, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX,
  },
});

const efeitos = [];
const react = {
  createContext: () => ({ Provider: () => null }),
  useContext: () => null,
  useState: (init) => [typeof init === "function" ? init() : init, () => {}],
  useRef: (init) => ({ current: init }),
  useCallback: (fn) => fn,
  useMemo: (fn) => fn(),
  useEffect: (fn) => {
    efeitos.push(fn);
  },
};
const stubs = {
  react,
  "react/jsx-runtime": { jsx: () => null, jsxs: () => null, Fragment: "Fragment" },
  "@/components/friends/FriendsMessengerDock": { FriendsMessengerDock: () => null },
  "./friends.css": {},
};
const requireStub = (nome) => {
  if (!(nome in stubs)) throw new Error(`modulo nao stubado no teste: ${nome}`);
  return stubs[nome];
};

const ouvintes = { document: {}, window: {} };
const criaAlvo = (nome, extra) => ({
  ...extra,
  addEventListener: (tipo, fn) => {
    (ouvintes[nome][tipo] ??= []).push(fn);
  },
  removeEventListener: (tipo, fn) => {
    ouvintes[nome][tipo] = (ouvintes[nome][tipo] ?? []).filter((f) => f !== fn);
  },
});
const documento = criaAlvo("document", { visibilityState: "visible" });
const janelaFake = criaAlvo("window", { setInterval: () => 1, clearInterval: () => {} });
const dispara = (alvo, tipo) => {
  for (const fn of [...(ouvintes[alvo][tipo] ?? [])]) fn();
};

let agora = 1_000_000;
const relogio = { now: () => agora };
let leiturasPulse = 0;
const fetchFake = async (url) => {
  if (url === "/api/friends/pulse") leiturasPulse += 1;
  return { ok: false, json: async () => ({}) };
};

const mod = { exports: {} };
const executa = new Function("require", "module", "exports", "window", "document", "fetch", "Date", outputText);
executa(requireStub, mod, mod.exports, janelaFake, documento, fetchFake, relogio);
const FriendsChatProvider = mod.exports.FriendsChatProvider;
assert.equal(typeof FriendsChatProvider, "function", "nao achei FriendsChatProvider no modulo transpilado");

FriendsChatProvider({ children: null, initialUserId: "u1" });
for (const efeito of efeitos) efeito();
// Montagem: o efeito de visibilidade le uma vez e o de conta le outra; isso nao e o caso do P-18.
leiturasPulse = 0;

// Cenario A: esconder a aba nao le nada.
agora += 60_000;
documento.visibilityState = "hidden";
dispara("document", "visibilitychange");
assert.equal(leiturasPulse, 0, "esconder a aba nao pode ler");
ok("aba escondida nao dispara leitura");

// Cenario B: voltar para a aba. visibilitychange e focus chegam juntos: 1 leitura so.
documento.visibilityState = "visible";
dispara("document", "visibilitychange");
dispara("window", "focus");
assert.equal(leiturasPulse, 1, `voltar para a aba deveria ler 1 vez, leu ${leiturasPulse}`);
ok("visibilitychange + focus seguidos geram 1 leitura");

// Cenario C: focus de novo logo em seguida (dentro de 2 s) nao le.
agora += 500;
dispara("window", "focus");
dispara("document", "visibilitychange");
assert.equal(leiturasPulse, 1, "segunda volta dentro de 2 s nao pode ler de novo");
ok("evento dentro de 2 s da ultima leitura e ignorado");

// Cenario D: depois de 2 s, uma nova volta le de novo.
agora += 5_000;
dispara("document", "visibilitychange");
dispara("window", "focus");
assert.equal(leiturasPulse, 2, `depois de 5 s deveria ler de novo, leu ${leiturasPulse} no total`);
ok("depois de 5 s, nova volta gera 1 leitura");

// Cenario E: focus sozinho (sem visibilitychange) tambem le uma vez quando passou de 2 s.
agora += 10_000;
dispara("window", "focus");
assert.equal(leiturasPulse, 3, "focus sozinho depois de 10 s deveria ler 1 vez");
ok("focus sozinho continua lendo");

console.log(`\nP-18 ok: ${passos} verificacoes`);
