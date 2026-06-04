/** Custo em PA por faixa de movimento (hex acumulados no turno). */

export const MOVEMENT_PA_COST = 1;

export type MovementPaBands = {
  walk: number;
  run: number;
  /** Primeiros N hex do turno: 1 PA ao entrar nesta faixa (min. 2 se walk ≥ 2). */
  firstBlock: number;
  /** A partir deste hex acumulado volta a gastar PA (corrida). */
  runChargeFrom: number;
  /** Hex na faixa de corrida por cada PA extra. */
  runBlockSize: number;
};

/** Faixas derivadas de walk/run da ficha ou monstro. */
export function movementPaBands(walk: number, run: number): MovementPaBands {
  const w = Math.max(1, Math.floor(walk));
  const r = Math.max(w, Math.floor(run));
  const firstBlock = Math.min(2, w);
  const runChargeFrom = Math.min(r, w + 2);
  const runSpan = Math.max(0, r - runChargeFrom + 1);
  const runBlockSize = runSpan <= 1 ? 1 : 2;
  return { walk: w, run: r, firstBlock, runChargeFrom, runBlockSize };
}

export function movementPaBandsForToken(token: {
  walk: number;
  run: number;
  movementWalkMax?: number;
  movementRunMax?: number;
}): MovementPaBands {
  const walk = token.movementWalkMax ?? token.walk;
  const run = token.movementRunMax ?? token.run;
  return movementPaBands(walk, run);
}

/**
 * PA deste deslocamento (hex já gastos no turno + distância do clique).
 * Ex. walk 4, run 7: hex 1–2 → 1 PA; 3–5 livres; a partir do 6 → 1 PA a cada 2 hex.
 */
export function movementPaCost(
  spentBefore: number,
  dist: number,
  bands: MovementPaBands
): number {
  if (dist <= 0) return 0;
  const spentAfter = spentBefore + dist;
  let cost = 0;

  if (spentBefore < bands.firstBlock && spentAfter > spentBefore) {
    cost += MOVEMENT_PA_COST;
  }

  if (spentAfter >= bands.runChargeFrom) {
    const runHexBefore = Math.max(0, spentBefore - bands.runChargeFrom + 1);
    const runHexAfter = Math.max(0, spentAfter - bands.runChargeFrom + 1);
    const blocksBefore = Math.ceil(runHexBefore / bands.runBlockSize);
    const blocksAfter = Math.ceil(runHexAfter / bands.runBlockSize);
    cost += MOVEMENT_PA_COST * Math.max(0, blocksAfter - blocksBefore);
  }

  return cost;
}

export function describeMovementPaBands(bands: MovementPaBands): string {
  const freeEnd = Math.min(bands.walk, bands.runChargeFrom - 1);
  const freeLabel =
    bands.firstBlock + 1 <= freeEnd
      ? `hex ${bands.firstBlock + 1}–${freeEnd} sem PA extra`
      : null;
  const parts = [
    `1º bloco: ${bands.firstBlock} hex → 1 PA`,
    freeLabel,
    bands.runChargeFrom <= bands.run
      ? `a partir do hex ${bands.runChargeFrom}: +1 PA / ${bands.runBlockSize} hex (corrida)`
      : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
