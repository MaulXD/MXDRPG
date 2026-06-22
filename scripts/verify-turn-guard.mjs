/**
 * Modo aventura (combatActive false) ignora ordem de iniciativa no ataque.
 * node scripts/verify-turn-guard.mjs
 */
import assert from "node:assert/strict";

function canActOnCombatTurn(tokenId, opts) {
  if (opts.bypassTurn) return true;
  if (opts.combatActive === false) return true;
  const hasOrder = opts.combatHasOrder ?? Boolean(opts.combat?.order?.length);
  if (!hasOrder) return true;
  if (!opts.activeTokenId) return false;
  return opts.activeTokenId === tokenId;
}

const turn = {
  activeTokenId: "other-token",
  bypassTurn: false,
  combatHasOrder: true,
  combatActive: false,
};

assert.equal(canActOnCombatTurn("my-token", turn), true, "aventura: ataque fora do turno permitido");

turn.combatActive = true;
assert.equal(canActOnCombatTurn("my-token", turn), false, "combate: fora do turno bloqueado");
assert.equal(canActOnCombatTurn("other-token", turn), true, "combate: turno ativo ok");

console.log("verify-turn-guard: ok");
