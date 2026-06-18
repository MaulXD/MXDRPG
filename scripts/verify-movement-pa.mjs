/**
 * Faixas de PA no movimento (walk/run).
 * node scripts/verify-movement-pa.mjs
 */
import assert from "node:assert/strict";

const MOVEMENT_PA_COST = 1;

function movementPaBands(walk, run) {
  const w = Math.max(1, Math.floor(walk));
  const r = Math.max(w, Math.floor(run));
  const firstBlock = Math.min(2, w);
  const runChargeFrom = Math.min(r, w + 2);
  const runSpan = Math.max(0, r - runChargeFrom + 1);
  const runBlockSize = runSpan <= 1 ? 1 : 2;
  return { walk: w, run: r, firstBlock, runChargeFrom, runBlockSize };
}

function movementPaCost(spentBefore, dist, bands) {
  if (dist <= 0) return 0;
  const spentAfter = spentBefore + dist;
  let cost = 0;
  if (spentBefore < bands.firstBlock && spentAfter > spentBefore) {
    cost += MOVEMENT_PA_COST;
  }
  if (spentAfter >= bands.runChargeFrom) {
    const runCellBefore = Math.max(0, spentBefore - bands.runChargeFrom + 1);
    const runCellAfter = Math.max(0, spentAfter - bands.runChargeFrom + 1);
    const blocksBefore = Math.ceil(runCellBefore / bands.runBlockSize);
    const blocksAfter = Math.ceil(runCellAfter / bands.runBlockSize);
    cost += MOVEMENT_PA_COST * Math.max(0, blocksAfter - blocksBefore);
  }
  return cost;
}

const bands47 = movementPaBands(4, 7);

assert.equal(movementPaCost(0, 2, bands47), 1);
assert.equal(movementPaCost(2, 2, bands47), 0);
assert.equal(movementPaCost(2, 3, bands47), 0, "células 3-5 livres");
assert.equal(movementPaCost(4, 2, bands47), 1, "entra corrida célula 5-6");
assert.equal(movementPaCost(5, 1, bands47), 1, "célula 6");

assert.equal(movementPaBands(3, 6).runChargeFrom, 5);
assert.equal(movementPaBands(6, 9).runChargeFrom, 8);

console.log("verify-movement-pa: OK");
