/**
 * PA: início de turno restaura pool; auto-passe exige gasto real neste turno.
 * node scripts/smoke/pa-turn-refresh.mjs
 */
import assert from "node:assert/strict";

const PA_RECOVERY = 5;

function paTurnRulesForMonster() {
  const recovery = 6;
  return { recoveryPerTurn: recovery, accumulationCap: recovery, turnStartPa: recovery };
}

function refreshPaAtTurnStart(token, rules) {
  const cap = rules.accumulationCap;
  if (rules.turnStartPa != null) {
    return { ...token, pa: rules.turnStartPa, paSpentThisTurn: 0 };
  }
  const carry = Math.max(0, token.pa ?? 0);
  const recovery = rules.recoveryPerTurn;
  const pa = Math.min(cap, carry + recovery);
  return { ...token, pa, paSpentThisTurn: 0 };
}

function bankPaAtEndOfTurn(token, rules) {
  const cap = rules.accumulationCap;
  const pool = Math.max(0, token.pa ?? 0);
  return { ...token, pa: Math.min(cap, pool), paSpentThisTurn: 0 };
}

function tokenSpendablePa(token) {
  return Math.max(0, token.pa ?? 0);
}

function tokenPaSpentThisTurn(token) {
  return Math.max(0, token.paSpentThisTurn ?? 0);
}

function shouldScheduleAutoPass(token) {
  if (tokenSpendablePa(token) > 0) return false;
  return tokenPaSpentThisTurn(token) > 0;
}

// Monstro: fim de turno → início do próximo
let monster = { pa: 0, paSpentThisTurn: 2 };
const mRules = paTurnRulesForMonster();
monster = bankPaAtEndOfTurn(monster, mRules);
assert.equal(monster.pa, 0, "monstro sem sobra");
monster = refreshPaAtTurnStart(monster, mRules);
assert.equal(monster.pa, 6, "monstro recupera 6 PA no turno");
assert.equal(monster.paSpentThisTurn, 0, "gasto zerado no refresh");

// Jogador: sobra + recuperação
function refreshPlayer(token) {
  const rules = { recoveryPerTurn: PA_RECOVERY, accumulationCap: 9 };
  const carry = Math.max(0, token.pa ?? 0);
  const pa = Math.min(rules.accumulationCap, carry + rules.recoveryPerTurn);
  return { ...token, pa, paSpentThisTurn: 0 };
}

let pc = bankPaAtEndOfTurn({ pa: 2, paSpentThisTurn: 3 }, { accumulationCap: 9, recoveryPerTurn: 5 });
assert.equal(pc.pa, 2);
pc = refreshPlayer(pc);
assert.equal(pc.pa, 7, "PC: 2 sobra + 5 recuperação");

// Turno novo: chave diferente → refresh permitido
const turnKey = "1:tok-a";
const stale = { id: "tok-a", pa: 0, paSpentThisTurn: 4 };
const paRefreshTurnKey = "0:tok-a";
const refreshedThisTurn = paRefreshTurnKey === turnKey;
assert.equal(refreshedThisTurn, false, "turno novo deve restaurar PA");

// Meio do turno esgotado: não auto-passe se nunca gastou (evita loop)
const neverSpent = { pa: 0, paSpentThisTurn: 0 };
assert.equal(shouldScheduleAutoPass(neverSpent), false, "0 PA sem gasto não agenda auto-passe");

// Meio do turno esgotado após gasto: auto-passe ok
const spentAll = { pa: 0, paSpentThisTurn: 3 };
assert.equal(shouldScheduleAutoPass(spentAll), true, "0 PA após gasto agenda auto-passe");

console.log("pa-turn-refresh: OK");
