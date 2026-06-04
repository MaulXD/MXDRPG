/**
 * Verifica tabela de XP Eldarin (Cap. 2.5).
 * node scripts/verify-xp.mjs
 */
import assert from "node:assert/strict";

function xpTotalForLevel(level) {
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

function canAdvanceLevel(level, xpTotal) {
  if (level >= 20) return false;
  return xpTotal >= xpTotalForLevel(level + 1);
}

function xpToNextLevel(level, xpTotal) {
  if (level >= 20) return 0;
  return Math.max(0, xpTotalForLevel(level + 1) - xpTotal);
}

assert.equal(xpTotalForLevel(1), 0);
assert.equal(xpTotalForLevel(2), 100);
assert.equal(xpTotalForLevel(3), 300);
assert.equal(xpTotalForLevel(4), 600);

assert.equal(canAdvanceLevel(3, 599), false);
assert.equal(canAdvanceLevel(3, 600), true);
assert.equal(canAdvanceLevel(3, 2800), true, "demo Aventureiro nv3");

assert.equal(xpToNextLevel(3, 2800), 0, "já passou do nv4");
assert.equal(xpToNextLevel(3, 300), 300, "faltam 300 até nv4");

assert.equal(canAdvanceLevel(3, 0), false);

console.log("verify-xp: OK — demo nv3 + 2800 XP pode subir para nv4");
