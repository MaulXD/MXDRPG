/** 1 célula do grid VTT = 1,5 m (Livro do Jogador §3.1.3). */
export const METERS_PER_CELL = 1.5;

/** Alcances de referência tática escalados a 70% (30% menores que a tabela clássica). */
export const TACTICAL_RANGE_SCALE = 0.7;

const FEET_TO_METERS = 0.3048;

/** Alcance normal em pés → metros Eldarin (70%). */
export function tacticalNormalRangeMeters(feet: number): number {
  return Math.round(feet * FEET_TO_METERS * TACTICAL_RANGE_SCALE);
}

/** Alcance longo em pés → metros Eldarin (70%). */
export function tacticalLongRangeMeters(feet: number): number {
  return Math.round(feet * FEET_TO_METERS * TACTICAL_RANGE_SCALE);
}

/** Alcance normal para highlight de ataque no VTT (`rangeCells`). */
export function tacticalNormalRangeCells(feet: number): number {
  const meters = feet * FEET_TO_METERS * TACTICAL_RANGE_SCALE;
  return Math.max(1, Math.round(meters / METERS_PER_CELL));
}

/** Alcance longo para tiro à distância (`rangeLongCells`). */
export function tacticalLongRangeCells(feet: number): number {
  const meters = feet * FEET_TO_METERS * TACTICAL_RANGE_SCALE;
  return Math.max(1, Math.round(meters / METERS_PER_CELL));
}

/** Par normal/longo formatado para tabelas do livro (ex.: `32/128m`). */
export function tacticalRangeLabelMeters(normalFeet: number, longFeet: number): string {
  return `${tacticalNormalRangeMeters(normalFeet)}/${tacticalLongRangeMeters(longFeet)}m`;
}

/** Referência tática — alcance normal em pés. */
export const TACTICAL_RANGED = {
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
  shortbow: tacticalNormalRangeCells(TACTICAL_RANGED.shortbow.normal),
  longbow: tacticalNormalRangeCells(TACTICAL_RANGED.longbow.normal),
  lightCrossbow: tacticalNormalRangeCells(TACTICAL_RANGED.lightCrossbow.normal),
  heavyCrossbow: tacticalNormalRangeCells(TACTICAL_RANGED.heavyCrossbow.normal),
  handCrossbow: tacticalNormalRangeCells(TACTICAL_RANGED.handCrossbow.normal),
  thrownLight: tacticalNormalRangeCells(TACTICAL_RANGED.thrownLight.normal),
} as const;

export const ELDARIN_RANGED_LONG_CELLS = {
  shortbow: tacticalLongRangeCells(TACTICAL_RANGED.shortbow.long),
  longbow: tacticalLongRangeCells(TACTICAL_RANGED.longbow.long),
  lightCrossbow: tacticalLongRangeCells(TACTICAL_RANGED.lightCrossbow.long),
  heavyCrossbow: tacticalLongRangeCells(TACTICAL_RANGED.heavyCrossbow.long),
  handCrossbow: tacticalLongRangeCells(TACTICAL_RANGED.handCrossbow.long),
  thrownLight: tacticalLongRangeCells(TACTICAL_RANGED.thrownLight.long),
} as const;

/** Bônus narrativos em metros (ex.: Osso de Grifo +3 m) → células extras. */
export function metersBonusToCells(meters: number): number {
  return Math.round(meters / METERS_PER_CELL);
}

/** @deprecated use tactical* */
export const DND_RANGE_SCALE = TACTICAL_RANGE_SCALE;
export const DND_RANGED = TACTICAL_RANGED;
export const dndNormalRangeMeters = tacticalNormalRangeMeters;
export const dndLongRangeMeters = tacticalLongRangeMeters;
export const dndNormalRangeCells = tacticalNormalRangeCells;
export const dndLongRangeCells = tacticalLongRangeCells;
export const dndRangeLabelMeters = tacticalRangeLabelMeters;
