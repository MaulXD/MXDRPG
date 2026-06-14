/**
 * Verifica PA: acumula até 9, recuperação +5, sem teto de gasto no turno.
 * Exploração: 5 PA fixos; início de combate: 5 sem acúmulo; 2º turno acumula sobra.
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

function startFull(carry = 0) {
  return { pa: Math.min(PA_ACCUM_CAP, PA_RECOVERY), bankedPa: 0, carryIgnored: carry };
}

function explorationDisplay() {
  return { pa: PA_RECOVERY, bankedPa: 0, paSpentThisTurn: 0 };
}

function enterCombatFromExploration(token) {
  return { pa: 0, bankedPa: 0, paSpentThisTurn: 0, from: token.pa };
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
assert.equal(t.pa, 5, "início de combate / iniciativa — sem acúmulo");

t = explorationDisplay();
assert.equal(t.pa, 5, "aventura — PA cravados em 5");

t = enterCombatFromExploration({ pa: 5 });
assert.equal(t.pa, 0, "entrada em combate zera pool da exploração");
t = startFull();
assert.equal(t.pa, 5, "ativo recebe 5 limpos na iniciativa");

t = endTurn({ pa: 2 });
t = refresh({ pa: t.pa });
assert.equal(t.pa, 7, "2º turno do mesmo token: 2 acumulados + 5");

function formatNext(remaining) {
  return Math.min(PA_ACCUM_CAP, remaining + PA_RECOVERY);
}

assert.equal(formatNext(4), 9);
assert.equal(formatNext(0), 5);

console.log("verify-pa-bank: OK");
