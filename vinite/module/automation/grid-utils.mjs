/**
 * Mede distância em espaços de grid célula entre dois tokens.
 * @param {TokenDocument|Token} tokenA
 * @param {TokenDocument|Token} tokenB
 * @returns {number}
 */
export function measureCellDistance(tokenA, tokenB) {
  const a = tokenA.object ?? tokenA;
  const b = tokenB.object ?? tokenB;
  if (!canvas?.grid || !a?.center || !b?.center) return Infinity;

  return canvas.grid.measureDistance(a.center, b.center, { gridSpaces: true });
}

/**
 * Verifica se o alvo está dentro do alcance simétrico.
 * @param {Token} attackerToken
 * @param {Token} targetToken
 * @param {number} rangeCells
 * @returns {boolean}
 */
export function isTargetInCellRange(attackerToken, targetToken, rangeCells) {
  const distance = measureCellDistance(attackerToken, targetToken);
  return distance <= rangeCells;
}

/**
 * Lê valores de movimento célula do ator.
 * @param {Actor} actor
 * @returns {{ walk: number, run: number, runApCost: number, mode: string }}
 */
export function getActorCellMovement(actor) {
  const cell = actor.system.movement?.cells ?? {};
  return {
    walk: cell.walk?.value ?? 0,
    run: cell.run?.value ?? 0,
    runApCost: cell.runActionPointCost ?? 1,
    mode: actor.system.movement?.mode ?? "walk",
  };
}
