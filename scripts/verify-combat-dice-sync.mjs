/**
 * Dado de combate só rola com valor do servidor (natural + total + CA).
 * node scripts/verify-combat-dice-sync.mjs
 */
import assert from "node:assert/strict";

function isCombatFxRollReady(fx) {
  if (fx.isHeal && fx.attackNatural == null && fx.attackTotal == null && fx.saveTotal == null) {
    return true;
  }
  if (fx.saveTotal != null && fx.saveDc != null) {
    return fx.attackNatural != null || fx.saveTotal != null;
  }
  return (
    fx.attackNatural != null &&
    fx.attackTotal != null &&
    fx.defenderAc != null &&
    (fx.hit === true || fx.hit === false || fx.criticalFail === true)
  );
}

const pending = { id: "pending-1", isHeal: false };
assert.equal(isCombatFxRollReady(pending), false, "pending sem dados não rola");

const resolvedMiss = {
  attackNatural: 13,
  attackTotal: 14,
  defenderAc: 15,
  hit: false,
};
assert.equal(isCombatFxRollReady(resolvedMiss), true, "erro com CA completo");

const partial = { attackNatural: 13, hit: false };
assert.equal(isCombatFxRollReady(partial), false, "natural sem CA não revela");

console.log("verify-combat-dice-sync: ok");
