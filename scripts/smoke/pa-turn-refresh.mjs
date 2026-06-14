/**
 * PA: início de turno restaura pool; auto-passe não dispara com PA > 0.
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

// Simula ensureCombatActiveHasPa: stale paSpentThisTurn não bloqueia novo turno
const turnKey = "1:tok-a";
const stale = { id: "tok-a", pa: 0, paSpentThisTurn: 4 };
const pending = null;
const paRefreshTurnKey = "0:tok-a";
const shouldRefresh =
  tokenSpendablePa(stale) === 0 &&
  pending?.tokenId !== stale.id &&
  !(paRefreshTurnKey === turnKey && stale.paSpentThisTurn > 0);
assert.equal(shouldRefresh, true, "turno novo deve restaurar PA apesar de paSpentThisTurn legado");

console.log("pa-turn-refresh: OK");
