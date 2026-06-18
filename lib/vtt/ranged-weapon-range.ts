/** 1 célula do grid VTT = 1,5 m (Livro do Jogador §3.1.3). */
export const METERS_PER_CELL = 1.5;

/** Eldarin usa alcances SRD/D&D 5e escalados a 70% (30% menores que a tabela PHB). */
export const DND_RANGE_SCALE = 0.7;

const FEET_TO_METERS = 0.3048;

/** Alcance normal SRD em pés → metros Eldarin (70% do PHB). */
export function dndNormalRangeMeters(feet: number): number {
  return Math.round(feet * FEET_TO_METERS * DND_RANGE_SCALE);
}

/** Alcance longo SRD em pés → metros Eldarin (70% do PHB). */
export function dndLongRangeMeters(feet: number): number {
  return Math.round(feet * FEET_TO_METERS * DND_RANGE_SCALE);
}

/** Alcance normal para highlight de ataque no VTT (`rangeCells`). */
export function dndNormalRangeCells(feet: number): number {
  const meters = feet * FEET_TO_METERS * DND_RANGE_SCALE;
  return Math.max(1, Math.round(meters / METERS_PER_CELL));
}

/** Alcance longo para tiro à distância (`rangeLongCells`). */
export function dndLongRangeCells(feet: number): number {
  const meters = feet * FEET_TO_METERS * DND_RANGE_SCALE;
  return Math.max(1, Math.round(meters / METERS_PER_CELL));
}

/** Par normal/longo formatado para tabelas do livro (ex.: `32/128m`). */
export function dndRangeLabelMeters(normalFeet: number, longFeet: number): string {
  return `${dndNormalRangeMeters(normalFeet)}/${dndLongRangeMeters(longFeet)}m`;
}

/** Referência SRD — alcance normal em pés. */
export const DND_RANGED = {
  shortbow: { normal: 80, long: 320 },
  longbow: { normal: 150, long: 600 },
  lightCrossbow: { normal: 80, long: 320 },
  heavyCrossbow: { normal: 100, long: 400 },
  handCrossbow: { normal: 30, long: 120 },
  dart: { normal: 20, long: 60 },
  sling: { normal: 30, long: 120 },
  blowgun: { normal: 25, long: 100 },
  thrownLight: { normal: 20, long: 60 },
} as const;

export const ELDARIN_RANGED_CELLS = {
  shortbow: dndNormalRangeCells(DND_RANGED.shortbow.normal),
  longbow: dndNormalRangeCells(DND_RANGED.longbow.normal),
  lightCrossbow: dndNormalRangeCells(DND_RANGED.lightCrossbow.normal),
  heavyCrossbow: dndNormalRangeCells(DND_RANGED.heavyCrossbow.normal),
  handCrossbow: dndNormalRangeCells(DND_RANGED.handCrossbow.normal),
  thrownLight: dndNormalRangeCells(DND_RANGED.thrownLight.normal),
} as const;

export const ELDARIN_RANGED_LONG_CELLS = {
  shortbow: dndLongRangeCells(DND_RANGED.shortbow.long),
  longbow: dndLongRangeCells(DND_RANGED.longbow.long),
  lightCrossbow: dndLongRangeCells(DND_RANGED.lightCrossbow.long),
  heavyCrossbow: dndLongRangeCells(DND_RANGED.heavyCrossbow.long),
  handCrossbow: dndLongRangeCells(DND_RANGED.handCrossbow.long),
  thrownLight: dndLongRangeCells(DND_RANGED.thrownLight.long),
} as const;

/** Bônus narrativos em metros (ex.: Osso de Grifo +3 m) → células extras. */
export function metersBonusToCells(meters: number): number {
  return Math.round(meters / METERS_PER_CELL);
}
