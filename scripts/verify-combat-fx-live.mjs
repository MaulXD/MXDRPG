/**
 * FX de combate: só anima jogadas após entrar na sala.
 * node scripts/verify-combat-fx-live.mjs
 */
import assert from "node:assert/strict";

const GRACE = 250;

function isLive(msg, joinedAtMs) {
  if (msg.kind !== "combat" || !msg.combat) return false;
  return msg.at >= joinedAtMs - GRACE;
}

function filterLive(chat, seen, joinedAtMs) {
  return chat.filter((m) => isLive(m, joinedAtMs) && !seen.has(m.id));
}

const joinedAt = 1_000_000;
const history = [
  { id: "old-1", at: joinedAt - 60_000, kind: "combat", combat: { x: 1 } },
  { id: "old-2", at: joinedAt - 1_000, kind: "combat", combat: { x: 2 } },
  { id: "live-1", at: joinedAt + 100, kind: "combat", combat: { x: 3 } },
];

const seen = new Set(["old-1"]);
const live = filterLive(history, seen, joinedAt);

assert.equal(live.length, 1, "só a jogada após abrir a sala");
assert.equal(live[0].id, "live-1");
assert.equal(isLive(history[1], joinedAt), false, "histórico recente não anima");
assert.equal(isLive(history[2], joinedAt), true, "jogada nova anima");

console.log("verify-combat-fx-live: OK");
