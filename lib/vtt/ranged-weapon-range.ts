/** 1 célula do grid VTT = 1,5 m (Livro do Jogador §3.1.3). */
export const METERS_PER_HEX = 1.5;

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

/** Alcance normal para highlight de ataque no VTT (`rangeHex`). */
export function dndNormalRangeHex(feet: number): number {
  const meters = feet * FEET_TO_METERS * DND_RANGE_SCALE;
  return Math.max(1, Math.round(meters / METERS_PER_HEX));
}

/** Alcance longo para tiro à distância (`rangeLongHex`). */
export function dndLongRangeHex(feet: number): number {
  const meters = feet * FEET_TO_METERS * DND_RANGE_SCALE;
  return Math.max(1, Math.round(meters / METERS_PER_HEX));
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

export const ELDARIN_RANGED_HEX = {
  shortbow: dndNormalRangeHex(DND_RANGED.shortbow.normal),
  longbow: dndNormalRangeHex(DND_RANGED.longbow.normal),
  lightCrossbow: dndNormalRangeHex(DND_RANGED.lightCrossbow.normal),
  heavyCrossbow: dndNormalRangeHex(DND_RANGED.heavyCrossbow.normal),
  handCrossbow: dndNormalRangeHex(DND_RANGED.handCrossbow.normal),
  thrownLight: dndNormalRangeHex(DND_RANGED.thrownLight.normal),
} as const;

export const ELDARIN_RANGED_LONG_HEX = {
  shortbow: dndLongRangeHex(DND_RANGED.shortbow.long),
  longbow: dndLongRangeHex(DND_RANGED.longbow.long),
  lightCrossbow: dndLongRangeHex(DND_RANGED.lightCrossbow.long),
  heavyCrossbow: dndLongRangeHex(DND_RANGED.heavyCrossbow.long),
  handCrossbow: dndLongRangeHex(DND_RANGED.handCrossbow.long),
  thrownLight: dndLongRangeHex(DND_RANGED.thrownLight.long),
} as const;

/** Bônus narrativos em metros (ex.: Osso de Grifo +3 m) → células extras. */
export function metersBonusToHex(meters: number): number {
  return Math.round(meters / METERS_PER_HEX);
}
