/**
 * Fases da economia de PA.
 * node scripts/smoke/combat-pa-phase.mjs
 */
import assert from "node:assert/strict";

function resolveCombatPaPhase(settings, combat) {
  if (!settings.combatActive) return "exploration";
  if (!combat?.order?.length) return "combat_free";
  return "combat_turn";
}

function phaseHasRealPaSpend(phase) {
  return phase !== "exploration";
}

function phaseHasTurnOrder(phase) {
  return phase === "combat_turn";
}

assert.equal(resolveCombatPaPhase({ combatActive: false }, null), "exploration");
assert.equal(resolveCombatPaPhase({ combatActive: true }, { order: [] }), "combat_free");
assert.equal(
  resolveCombatPaPhase({ combatActive: true }, { order: ["a"] }),
  "combat_turn"
);

assert.equal(phaseHasRealPaSpend("exploration"), false);
assert.equal(phaseHasRealPaSpend("combat_free"), true);
assert.equal(phaseHasTurnOrder("combat_free"), false);
assert.equal(phaseHasTurnOrder("combat_turn"), true);

console.log("combat-pa-phase: OK");
