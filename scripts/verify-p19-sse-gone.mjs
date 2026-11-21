/**
 * P-19 (desempenho): o tickInterval do SSE de sala (app/api/room/[roomId]/events/route.ts)
 * chamava getRoomRevision a cada 5 s por cliente, so para descobrir se a sala sumiu ('gone').
 *
 * Correcao: o tick de 5 s continua rodando tickRoomAutoPassThrottled (o passe automatico de
 * turno depende dele), mas o check de 'gone' so roda a cada GONE_CHECK_MS = 30 s.
 * Heartbeat, presenca e o push de revisao (onRoomUpdated) nao mudam.
 *
 * Teste: leitura de codigo. Confere as constantes, a ordem dentro do tick e que o push de
 * revisao e o heartbeat continuam como estavam.
 *
 * node scripts/verify-p19-sse-gone.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFileSync(join(ROOT, rel), "utf8");

let passos = 0;
const ok = (nome) => {
  passos += 1;
  console.log(`ok ${passos}: ${nome}`);
};

const rota = ler("app/api/room/[roomId]/events/route.ts");

// 1. Constantes.
const tick = rota.match(/const TICK_MS = ([\d_]+);/);
assert.ok(tick, "falta a constante TICK_MS");
assert.equal(Number(tick[1].replace(/_/g, "")), 5000, "TICK_MS precisa continuar 5 s (auto-pass)");
ok("TICK_MS segue em 5 s para o passe automatico de turno");

const gone = rota.match(/const GONE_CHECK_MS = ([\d_]+);/);
assert.ok(gone, "falta a constante GONE_CHECK_MS");
assert.equal(Number(gone[1].replace(/_/g, "")), 30000, "GONE_CHECK_MS precisa ser 30 s");
ok("GONE_CHECK_MS = 30 s");

const heart = rota.match(/const HEARTBEAT_MS = ([\d_]+);/);
assert.ok(heart, "falta a constante HEARTBEAT_MS");
assert.equal(Number(heart[1].replace(/_/g, "")), 15000, "HEARTBEAT_MS nao pode mudar");
ok("HEARTBEAT_MS intacto em 15 s");

// 2. Corpo do tickInterval.
const inicio = rota.indexOf("const tickInterval = setInterval(");
const fimTick = rota.indexOf("}, TICK_MS);", inicio);
assert.ok(inicio > 0 && fimTick > inicio, "nao achei o bloco do tickInterval");
const corpoTick = rota.slice(inicio, fimTick);

const iAutoPass = corpoTick.indexOf("tickRoomAutoPassThrottled(roomId)");
assert.ok(iAutoPass >= 0, "tick deixou de chamar tickRoomAutoPassThrottled");
ok("tick continua chamando tickRoomAutoPassThrottled a cada 5 s");

const iGuarda = corpoTick.indexOf("if (Date.now() - lastGoneCheck < GONE_CHECK_MS) return;");
const iRevisao = corpoTick.indexOf("getRoomRevision(roomId)");
assert.ok(iGuarda >= 0, "tick sem a guarda de 30 s antes do check de 'gone'");
assert.ok(iRevisao >= 0, "tick deixou de checar 'gone' via getRoomRevision");
assert.ok(iAutoPass < iGuarda && iGuarda < iRevisao, "ordem errada: auto-pass, depois guarda de 30 s, depois getRoomRevision");
ok("getRoomRevision so roda depois da guarda de 30 s; auto-pass roda antes e a cada tick");

assert.match(corpoTick, /lastGoneCheck = Date\.now\(\);/, "o instante da checagem precisa ser gravado");
assert.match(rota, /let lastGoneCheck = connectedAt;/, "lastGoneCheck precisa começar em connectedAt");
ok("instante da ultima checagem e gravado e inicia em connectedAt");

assert.match(corpoTick, /push\(\{ type: "gone" \}\);/, "o evento 'gone' precisa continuar sendo enviado");
assert.match(corpoTick, /rev == null/, "a condicao de 'gone' (rev == null) precisa continuar");
ok("evento 'gone' e a condicao rev == null continuam iguais");

// 3. Push de revisao intacto (chega na hora por onRoomUpdated).
const iOuvinte = rota.indexOf("const unsubNotifier = onRoomUpdated(roomId, (revision) => {");
assert.ok(iOuvinte > 0, "onRoomUpdated sumiu ou mudou");
const corpoOuvinte = rota.slice(iOuvinte, rota.indexOf("const tickInterval = setInterval(", iOuvinte));
assert.match(corpoOuvinte, /if \(revision > lastSent\) \{/, "onRoomUpdated perdeu a guarda de revisao nova");
assert.match(corpoOuvinte, /push\(\{ type: "revision", revision \}\);/, "onRoomUpdated deixou de enviar o evento 'revision'");
ok("onRoomUpdated intacto: revisao nova continua indo na hora");

// 4. Heartbeat e presenca intactos.
const iHeart = rota.indexOf("const heartbeatInterval = setInterval(");
assert.ok(iHeart > 0, "heartbeat sumiu");
const corpoHeart = rota.slice(iHeart, rota.indexOf("}, HEARTBEAT_MS);", iHeart));
assert.match(corpoHeart, /flushPresence\(\);/, "heartbeat deixou de dar flush na presenca");
assert.match(corpoHeart, /touchRoomPresence\(roomId, user\.id, presenceLabel\)/, "heartbeat deixou de tocar a presenca");
assert.match(corpoHeart, /: heartbeat\\n\\n/, "heartbeat deixou de enviar o comentario ': heartbeat'");
ok("heartbeat e presenca intactos");

console.log(`\nP-19 ok: ${passos} verificacoes`);
