/**
 * P-14 (desempenho): dois ajustes de polling e de retorno de sala.
 *
 * 1. Pausa com aba escondida: useSheetEditRequest e usePlayerInventoryRequests
 *    deixam de usar window.setInterval direto e passam por startVisiblePoll
 *    (hooks/usePollWhenVisible.ts), como os demais hooks. Intervalos mantidos:
 *    30 s sem pedido e 5 s com pedido pendente (inventario).
 *
 * 2. Um Anel: TorEyePanel aplica o snapshot devolvido por patchTorSession
 *    (PATCH /api/room/[id]/tor-session, que devolve { snapshot } e e desembrulhado
 *    pelo cliente). As rotas tor-advance, tor-recovery e tor-eye devolvem
 *    { snapshot } envelopado; o cliente desembrulha (P-15) e os paineis passam
 *    o retorno para onUpdate(snapshot).
 *
 * Teste: leitura de codigo (React nao roda em node), mesmo padrao do P-13.
 *
 * node scripts/verify-p14-pausa-e-um-anel.mjs
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

// 1. Pausa com aba escondida.
const sheetReq = ler("hooks/useSheetEditRequest.ts");
assert.doesNotMatch(sheetReq, /\bsetInterval\(/,"useSheetEditRequest: sem setInterval direto");
assert.match(sheetReq, /import \{ startVisiblePoll \} from "@\/hooks\/usePollWhenVisible"/, "useSheetEditRequest: importa startVisiblePoll");
assert.match(sheetReq, /const POLL_MS = 30_000;/, "useSheetEditRequest: intervalo de 30 s");
const sheetPolls = sheetReq.match(/return startVisiblePoll\(\(\) => void refresh\(\), POLL_MS\);/g) ?? [];
assert.equal(sheetPolls.length, 3, "useSheetEditRequest: os tres hooks de pedido usam startVisiblePoll");
ok("useSheetEditRequest pausa com aba escondida (30 s)");

const invReq = ler("hooks/useInventoryItemRequest.ts");
const invSetIntervals = invReq.match(/\bsetInterval\(/g) ?? [];
assert.equal(invSetIntervals.length, 0, "useInventoryItemRequest: sem window.setInterval");
assert.match(invReq, /import \{ startVisiblePoll \} from "@\/hooks\/usePollWhenVisible"/, "useInventoryItemRequest: importa startVisiblePoll");
assert.match(invReq, /const POLL_FAST_MS = 5_000;/, "useInventoryItemRequest: POLL_FAST de 5 s");
assert.match(invReq, /const POLL_MS = 30_000;/, "useInventoryItemRequest: POLL de 30 s");
assert.match(
  invReq,
  /const interval = hasPending \? POLL_FAST_MS : POLL_MS;\s*return startVisiblePoll\(\(\) => void refresh\(\), interval\);/,
  "useInventoryItemRequest: 5 s com pedido pendente, 30 s sem, via startVisiblePoll"
);
assert.match(invReq, /\}, \[characterId, enabled, refresh, hasPending\]\);/, "useInventoryItemRequest: intervalo recalcula com hasPending");
ok("useInventoryItemRequest pausa com aba escondida (5 s pendente / 30 s sem)");

// 2. Um Anel: TorEyePanel aplica o snapshot do PATCH.
const eye = ler("components/vtt/TorEyePanel.tsx");
assert.match(eye, /onUpdate: \(payload\?: RoomApiPayload\) => void/, "TorEyePanel: onUpdate aceita payload");
assert.match(eye, /import type \{ RoomApiPayload \} from "@\/lib\/room\/room-delta"/, "TorEyePanel: importa o tipo do payload");
assert.match(
  eye,
  /const snapshot = await patchTorSession\(roomId, \{ eye: \{ \.\.\.eye, \.\.\.patch \} \}\);\s*onUpdate\(snapshot\);/,
  "TorEyePanel: patchEye aplica o snapshot do PATCH"
);
assert.match(
  eye,
  /const snapshot = await patchTorSession\(roomId, \{\s*eye: \{\s*value: breakdown\.total,[\s\S]*?\}\);\s*onUpdate\(snapshot\);/,
  "TorEyePanel: ligar o Olho aplica o snapshot do PATCH"
);
const eyePatchCalls = eye.match(/await patchTorSession\(/g) ?? [];
const eyeSnapshotCalls = eye.match(/const snapshot = await patchTorSession\(/g) ?? [];
assert.equal(eyePatchCalls.length, eyeSnapshotCalls.length, "TorEyePanel: todo patchTorSession guarda o retorno");
ok("TorEyePanel aplica o snapshot de patchTorSession (3 pontos)");

// P-15: postRoomTorEye desembrulha { snapshot }; as gravacoes do Olho aplicam o retorno.
assert.equal((eye.match(/onUpdate\(\);/g) ?? []).length, 0, "TorEyePanel: nenhum onUpdate() vazio");
assert.equal((eye.match(/const snapshot = await postRoomTorEye\(/g) ?? []).length, 3, "TorEyePanel: as 3 gravacoes do Olho guardam o retorno");
ok("TorEyePanel aplica o retorno de postRoomTorEye (P-15)");

const advance = ler("components/vtt/TorAdvancePanel.tsx");
assert.match(advance, /onUpdate: \(payload\?: RoomApiPayload\) => void;/, "TorAdvancePanel: onUpdate aceita payload (P-15)");
assert.equal((advance.match(/onUpdate\(\)/g) ?? []).length, 0, "TorAdvancePanel: nenhum onUpdate() vazio");
ok("TorAdvancePanel passa o retorno para onUpdate (P-15)");

// O cliente de patchTorSession desembrulha o snapshot, que e o que o TorEyePanel recebe.
const hookSync = ler("hooks/useRoomSync.ts");
assert.match(
  hookSync,
  /const data = \(await res\.json\(\)\) as \{ snapshot: RoomSnapshot \};\s*return data\.snapshot;/,
  "patchTorSession: desembrulha { snapshot } e devolve RoomSnapshot"
);
ok("patchTorSession devolve RoomSnapshot desembrulhado");

console.log(`\nP-14: ${passos} verificacoes ok.`);
