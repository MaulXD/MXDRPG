/**
 * BV-073/BV-074: o painel de Jornada e o de Conselho do Um Anel ficavam no
 * formulário mesmo com a jornada ou o conselho gravados no servidor. A sessão do
 * Um Anel (torSession) não entrava no delta da sala nem na fatia do mapa do store
 * da mesa, então os painéis recebiam sempre undefined, até depois de recarregar.
 *
 * Testa buildRoomDelta e mergeRoomDelta de verdade (funções puras, transpiladas)
 * e confere a fatia do store por leitura.
 *
 * node scripts/verify-bv073-sessao-um-anel.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFileSync(join(ROOT, rel), "utf8");

// room-delta.ts só importa tipos e normalizeRoomSettings (usado no caso sem base).
const fonte = ler("lib/room/room-delta.ts").replace(
  /import \{ normalizeRoomSettings \} from "@\/lib\/room\/settings";/,
  "const normalizeRoomSettings = (s) => s ?? {};"
);
const js = ts.transpileModule(fonte, {
  compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { buildRoomDelta, mergeRoomDelta } = await import("data:text/javascript," + encodeURIComponent(js));

const base = (rev, torSession) => ({
  roomId: "r",
  revision: rev,
  settings: {},
  scene: { id: "r", name: "", cellSize: 70, gridRadius: 24, tokens: [] },
  actors: {},
  combat: { round: 1, activeIndex: 0, order: [] },
  chat: [],
  pings: [],
  ...(torSession !== undefined ? { torSession } : {}),
});

let fail = 0;
function caso(nome, fn) {
  try {
    fn();
    console.log(`  ✓ ${nome}`);
  } catch (e) {
    fail++;
    console.error(`  ✗ ${nome}: ${e.message}`);
  }
}

console.log("verify-bv073-sessao-um-anel: a sessão do Um Anel chega aos painéis");

const jornada = { journey: { trechos: 10, remaining: 10 } };
caso("delta leva a sessão quando ela muda", () => {
  const d = buildRoomDelta(base(1), base(2, jornada));
  assert.deepEqual(d.torSession, jornada);
});
caso("delta sem mudança de sessão não leva a chave", () => {
  const d = buildRoomDelta(base(1, jornada), base(2, jornada));
  assert.equal("torSession" in d, false);
});
caso("sessão apagada vai como null (sobrevive ao JSON)", () => {
  const d = JSON.parse(JSON.stringify(buildRoomDelta(base(1, jornada), base(2))));
  assert.equal(d.torSession, null);
});
caso("merge aplica a sessão nova", () => {
  const m = mergeRoomDelta(base(1), JSON.parse(JSON.stringify(buildRoomDelta(base(1), base(2, jornada)))));
  assert.deepEqual(m.torSession, jornada);
  assert.equal(m.revision, 2);
});
caso("merge com null apaga a sessão", () => {
  const m = mergeRoomDelta(base(1, jornada), { kind: "delta", roomId: "r", revision: 2, torSession: null });
  assert.equal(m.torSession, undefined);
});
caso("merge sem a chave mantém a sessão", () => {
  const b = base(1, jornada);
  const m = mergeRoomDelta(b, { kind: "delta", roomId: "r", revision: 2 });
  assert.equal(m.torSession, b.torSession);
});

const STORE = ler("hooks/vtt/mesa-room-store.ts");
caso("store: a fatia do mapa carrega torSession", () => {
  assert.match(STORE, /torSession: s\.torSession,/);
  assert.match(STORE, /torSession: map\.torSession,/);
  assert.match(STORE, /prev\?\.torSession !== nextSnap\?\.torSession/);
});

if (fail) process.exit(1);
