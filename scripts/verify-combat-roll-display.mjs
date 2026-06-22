/**
 * Formatação total vs CA/CD no painel de dado de combate.
 * node scripts/verify-combat-roll-display.mjs
 */
import assert from "node:assert/strict";

function formatModifier(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function buildFormulaLine(natural, modifier, total, difficultyLabel, difficulty) {
  const vs = `VS ${difficultyLabel} ${difficulty}`;
  if (natural != null && modifier != null && modifier !== 0) {
    return `Rolagem ${natural}${formatModifier(modifier)}=${total} ${vs}`;
  }
  if (natural != null && natural !== total) {
    return `Rolagem ${natural}=${total} ${vs}`;
  }
  if (natural != null) {
    return `Rolagem ${natural} ${vs}`;
  }
  return `${total} ${vs}`;
}

assert.equal(
  buildFormulaLine(13, 1, 14, "CA", 15),
  "Rolagem 13+1=14 VS CA 15"
);
assert.equal(
  buildFormulaLine(8, 3, 11, "CD", 14),
  "Rolagem 8+3=11 VS CD 14"
);
assert.equal(
  buildFormulaLine(17, null, 17, "CA", 12),
  "Rolagem 17 VS CA 12"
);
assert.equal(
  buildFormulaLine(6, -2, 4, "CA", 18),
  "Rolagem 6-2=4 VS CA 18"
);

console.log("verify-combat-roll-display: ok");
