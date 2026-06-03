/**
 * Mede distância em espaços de grid hex entre dois tokens.
 * @param {TokenDocument|Token} tokenA
 * @param {TokenDocument|Token} tokenB
 * @returns {number}
 */
export function measureHexDistance(tokenA, tokenB) {
  const a = tokenA.object ?? tokenA;
  const b = tokenB.object ?? tokenB;
  if (!canvas?.grid || !a?.center || !b?.center) return Infinity;

  return canvas.grid.measureDistance(a.center, b.center, { gridSpaces: true });
}

/**
 * Verifica se o alvo está dentro do alcance hexagonal.
 * @param {Token} attackerToken
 * @param {Token} targetToken
 * @param {number} rangeHex
 * @returns {boolean}
 */
export function isTargetInHexRange(attackerToken, targetToken, rangeHex) {
  const distance = measureHexDistance(attackerToken, targetToken);
  return distance <= rangeHex;
}

/**
 * Lê valores de movimento hex do ator.
 * @param {Actor} actor
 * @returns {{ walk: number, run: number, runApCost: number, mode: string }}
 */
export function getActorHexMovement(actor) {
  const hex = actor.system.movement?.hex ?? {};
  return {
    walk: hex.walk?.value ?? 0,
    run: hex.run?.value ?? 0,
    runApCost: hex.runActionPointCost ?? 1,
    mode: actor.system.movement?.mode ?? "walk",
  };
}
