/**
 * P-15 (Um Anel): as rotas tor-fatigue, tor-advance e tor-recovery devolvem
 * { snapshot }. As funcoes cliente em hooks/useRoomSync.ts precisam desembrulhar
 * e devolver a sala (igual patchTorSession), e o TorAdvancePanel precisa passar
 * esse retorno para onUpdate(payload), sem onUpdate() vazio.
 *
 * Parte 1 (comportamento): carrega hooks/useRoomSync.ts transpilado com o
 * TypeScript, com imports stubados, e chama as funcoes com fetch stubado.
 * Parte 2 (leitura): TorAdvancePanel e TorJourneyPanel.
 *
 * node scripts/verify-p15-envelope-um-anel.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFileSync(join(ROOT, rel), "utf8");

let passos = 0;
const ok = (nome) => {
  passos += 1;
  console.log(`ok ${passos}: ${nome}`);
};

// --- 1. Comportamento: funcoes cliente desembrulham { snapshot } ---------------

const SALA = { revision: 5, roomId: "sala-1", phase: "companhia" };
const chamadas = [];
globalThis.fetch = async (url, init) => {
  chamadas.push({ url: String(url), init });
  return new Response(JSON.stringify({ snapshot: SALA }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// Qualquer import (react, @/...) vira um stub que aceita qualquer uso.
const stub = new Proxy(function () {}, {
  get: (_t, k) => (k === "__esModule" ? true : stub),
  apply: () => stub,
  construct: () => stub,
});
const transpilado = ts.transpileModule(ler("hooks/useRoomSync.ts"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
}).outputText;
const modulo = { exports: {} };
const req = (nome) => (nome.startsWith(".") || nome.startsWith("@/") || nome === "react" ? stub : require(nome));
new Function("require", "module", "exports", transpilado)(req, modulo, modulo.exports);
const api = modulo.exports;

for (const nome of ["postRoomTorFatigue", "postRoomTorAdvance", "postRoomTorRecovery"]) {
  assert.equal(typeof api[nome], "function", `${nome} exportada`);
}

const fatiga = await api.postRoomTorFatigue("sala-1", { scope: "company", points: 2, source: "evento" });
assert.deepEqual(fatiga, SALA, "postRoomTorFatigue devolve a sala, nao o envelope");
assert.match(chamadas.at(-1).url, /\/api\/room\/sala-1\/tor-fatigue$/, "postRoomTorFatigue chama tor-fatigue");
ok("postRoomTorFatigue devolve a sala desembrulhada");

const avanco = await api.postRoomTorAdvance("sala-1", "heroi-1", { kind: "valour" });
assert.deepEqual(avanco, SALA, "postRoomTorAdvance devolve a sala, nao o envelope");
assert.match(chamadas.at(-1).url, /\/api\/room\/sala-1\/tor-advance$/, "postRoomTorAdvance chama tor-advance");
ok("postRoomTorAdvance devolve a sala desembrulhada");

const recuperacao = await api.postRoomTorRecovery("sala-1", "heroi-1", "spiritual");
assert.deepEqual(recuperacao, SALA, "postRoomTorRecovery devolve a sala, nao o envelope");
assert.match(chamadas.at(-1).url, /\/api\/room\/sala-1\/tor-recovery$/, "postRoomTorRecovery chama tor-recovery");
ok("postRoomTorRecovery devolve a sala desembrulhada");

const olho = await api.postRoomTorEye("sala-1", { action: "reveal" });
assert.deepEqual(olho, SALA, "postRoomTorEye devolve a sala, nao o envelope");
assert.match(chamadas.at(-1).url, /\/api\/room\/sala-1\/tor-eye$/, "postRoomTorEye chama tor-eye");
ok("postRoomTorEye devolve a sala desembrulhada");

// Pedido da Lupa (2a): postura, empurrão e tarefa iam direto para onRoomSync do
// TorAttackPopup, que aplicava o envelope como sala. Sombra, elmo e perigo também.
for (const [nome, rota, args] of [
  ["postRoomTorStance", "tor-stance", ["sala-1", "tok-1", "forward"]],
  ["postRoomTorPush", "tor-push", ["sala-1", "tok-1"]],
  ["postRoomTorTask", "tor-task", ["sala-1", "tok-1", "intimidar"]],
  ["postRoomTorShadow", "tor-shadow", ["sala-1", "tok-1", { kind: "gain", points: 1 }]],
  ["postRoomTorHelm", "tor-helm", ["sala-1", "tok-1"]],
]) {
  const r = await api[nome](...args);
  assert.deepEqual(r, SALA, `${nome} devolve a sala, nao o envelope`);
  assert.match(chamadas.at(-1).url, new RegExp(`/api/room/sala-1/${rota}$`), `${nome} chama ${rota}`);
}
ok("postura, empurrão, tarefa, sombra e elmo devolvem a sala desembrulhada");

{
  const r = await api.postRoomTorHazard("sala-1", "tok-1", { kind: "poison" });
  assert.equal(r.revision, SALA.revision, "postRoomTorHazard devolve a sala");
  assert.equal("snapshot" in r, false, "postRoomTorHazard ainda devolve o envelope");
  ok("perigo devolve a sala desembrulhada e mantém o sheetSaved");
}

// --- 2. Leitura: paineis passam o retorno para onUpdate ----------------------

const advance = ler("components/vtt/TorAdvancePanel.tsx");
assert.match(advance, /onUpdate: \(payload\?: RoomApiPayload\) => void/, "TorAdvancePanel: onUpdate aceita payload");
assert.match(advance, /const snapshot = await postRoomTorAdvance\(roomId, characterId, what\);\s*onUpdate\(snapshot\);/, "TorAdvancePanel: compra aplica o retorno");
assert.match(advance, /const snapshot = await postRoomTorRecovery\(roomId, characterId, "spiritual"\);\s*onUpdate\(snapshot\);/, "TorAdvancePanel: recuperacao aplica o retorno");
assert.equal((advance.match(/onUpdate\(\)/g) ?? []).length, 0, "TorAdvancePanel: sem onUpdate() vazio depois de gravar");
assert.doesNotMatch(advance, /\brefresh\(\)/, "TorAdvancePanel: sem refresh() depois de gravar");
ok("TorAdvancePanel passa o retorno para onUpdate, sem onUpdate() vazio");

const journey = ler("components/vtt/TorJourneyPanel.tsx");
assert.equal((journey.match(/onUpdate\(\)/g) ?? []).length, 0, "TorJourneyPanel: sem onUpdate() vazio");
assert.equal((journey.match(/onUpdate\(snapshot\);/g) ?? []).length >= 2, true, "TorJourneyPanel: fadigas aplicam o retorno");
ok("TorJourneyPanel passa o retorno das fadigas para onUpdate");

console.log(`\nP-15: ${passos} verificacoes ok`);
