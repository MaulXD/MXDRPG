/**
 * Pathfinding no grid quadrado (8 direções, Chebyshev) + ocupação.
 * node scripts/verify-grid-path.mjs
 */
import assert from "node:assert/strict";

function axialKey(a) {
  return `${a.q},${a.r}`;
}

function axialDistance(a, b) {
  return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r));
}

const DIRS = [
  { q: 1, r: 0 },
  { q: 1, r: 1 },
  { q: 0, r: 1 },
  { q: -1, r: 1 },
  { q: -1, r: 0 },
  { q: -1, r: -1 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
];

function neighbors(a) {
  return DIRS.map((d) => ({ q: a.q + d.q, r: a.r + d.r }));
}

function findGridPath(from, to, maxSteps, canEnter) {
  if (from.q === to.q && from.r === to.r) return [from];
  const startKey = axialKey(from);
  const goalKey = axialKey(to);
  const parent = new Map();
  const dist = new Map([[startKey, 0]]);
  const queue = [from];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const curKey = axialKey(cur);
    const curDist = dist.get(curKey) ?? 0;
    if (curKey === goalKey) {
      const path = [to];
      let k = goalKey;
      while (k !== startKey) {
        const p = parent.get(k);
        path.unshift(p);
        k = axialKey(p);
      }
      return path;
    }
    if (curDist >= maxSteps) continue;
    for (const n of neighbors(cur)) {
      const nk = axialKey(n);
      if (dist.has(nk)) continue;
      if (!canEnter(n)) continue;
      dist.set(nk, curDist + 1);
      parent.set(nk, cur);
      queue.push(n);
    }
  }
  return null;
}

const blocked = new Set(["2,0"]);
const canEnter = (h) => !blocked.has(axialKey(h));

const path = findGridPath({ q: 0, r: 0 }, { q: 3, r: 0 }, 6, canEnter);
assert.ok(path, "deve contornar bloqueio");
assert.ok(path.length >= 4, "caminho mais longo que linha reta");
assert.equal(axialDistance(path[0], path[path.length - 1]), 3);

const noPath = findGridPath({ q: 0, r: 0 }, { q: 2, r: 0 }, 6, (h) => h.q !== 1);
assert.equal(noPath, null);

console.log("verify-grid-path: OK");
