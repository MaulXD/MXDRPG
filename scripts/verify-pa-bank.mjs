/**
 * Verifica PA: acumula até 9, recuperação +5, sem teto de gasto no turno.
 * node scripts/verify-pa-bank.mjs
 */
import assert from "node:assert/strict";

const PA_RECOVERY = 5;
const PA_ACCUM_CAP = 9;

function endTurn(token) {
  const pool = Math.max(0, token.pa ?? 0) + (token.bankedPa ?? 0);
  return { ...token, pa: Math.min(PA_ACCUM_CAP, pool), bankedPa: 0, paSpentThisTurn: 0 };
}

function refresh(token) {
  const carry = Math.max(0, token.pa ?? 0);
  const pa = Math.min(PA_ACCUM_CAP, carry + PA_RECOVERY);
  return { ...token, pa, bankedPa: 0, paSpentThisTurn: 0 };
}

function startFull() {
  return { pa: PA_RECOVERY, bankedPa: 0 };
}

let t = endTurn({ pa: 3, bankedPa: 0 });
assert.equal(t.pa, 3);

t = refresh({ pa: 3 });
assert.equal(t.pa, 8, "sobra 3 + recuperação 5");

t = refresh({ pa: 0 });
assert.equal(t.pa, 5, "turno limpo");

t = endTurn({ pa: 5 });
t = refresh({ pa: 5 });
assert.equal(t.pa, 9, "sobra 5 + 5 = 10 → teto 9");

t = endTurn({ pa: 12 });
assert.equal(t.pa, 9, "fim de turno corta acúmulo em 9");

t = startFull();
assert.equal(t.pa, 5);

function formatNext(remaining) {
  return Math.min(PA_ACCUM_CAP, remaining + PA_RECOVERY);
}

assert.equal(formatNext(4), 9);
assert.equal(formatNext(0), 5);

console.log("verify-pa-bank: OK");
