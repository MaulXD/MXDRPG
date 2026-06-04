import type { AttributeKey } from "@/lib/character/rules";
import { getRace } from "@/lib/character/rules";

/** Eldarin Cap. 10 — compra de pontos (base 8, pool 27). */
export const POINT_BUY_POOL = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX_BEFORE_RACIAL = 15;

const COST_TABLE: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const ATTR_ORDER: AttributeKey[] = [
  "forca",
  "destreza",
  "constituicao",
  "inteligencia",
  "sabedoria",
  "carisma",
];

export function pointBuyCost(score: number): number {
  return COST_TABLE[score] ?? 99;
}

export function totalPointBuyCost(scores: Record<AttributeKey, number>): number {
  let sum = 0;
  for (const key of ATTR_ORDER) {
    sum += pointBuyCost(scores[key] ?? 8);
  }
  return sum;
}

export function defaultPointBuyScores(): Record<AttributeKey, number> {
  return {
    forca: 8,
    destreza: 8,
    constituicao: 8,
    inteligencia: 8,
    sabedoria: 8,
    carisma: 8,
  };
}

/** Distribuição sugerida (27 pts) por classe — Eldarin point-buy. */
export function suggestedPointBuyForClass(classe: string): Record<AttributeKey, number> {
  switch (classe) {
    case "Mago":
    case "Artífice":
      return {
        forca: 8,
        destreza: 13,
        constituicao: 14,
        inteligencia: 15,
        sabedoria: 12,
        carisma: 10,
      };
    case "Clérigo":
    case "Druida":
      return {
        forca: 8,
        destreza: 12,
        constituicao: 14,
        inteligencia: 10,
        sabedoria: 15,
        carisma: 13,
      };
    case "Ladino":
    case "Bardo":
      return {
        forca: 8,
        destreza: 15,
        constituicao: 12,
        inteligencia: 10,
        sabedoria: 10,
        carisma: 14,
      };
    case "Patrulheiro":
      return {
        forca: 10,
        destreza: 15,
        constituicao: 14,
        inteligencia: 10,
        sabedoria: 12,
        carisma: 8,
      };
    case "Bárbaro":
      return {
        forca: 15,
        destreza: 12,
        constituicao: 14,
        inteligencia: 8,
        sabedoria: 10,
        carisma: 10,
      };
    default:
      return {
        forca: 15,
        destreza: 14,
        constituicao: 14,
        inteligencia: 8,
        sabedoria: 12,
        carisma: 8,
      };
  }
}

export function isUnsetPointBuy(scores: Record<AttributeKey, number>): boolean {
  return totalPointBuyCost(scores) === 0;
}

export function pointBuyIncreaseCost(
  scores: Record<AttributeKey, number>,
  key: AttributeKey
): number {
  const cur = scores[key] ?? POINT_BUY_MIN;
  if (cur >= POINT_BUY_MAX_BEFORE_RACIAL) return 99;
  return pointBuyCost(cur + 1) - pointBuyCost(cur);
}

export function canIncreasePointBuy(
  scores: Record<AttributeKey, number>,
  key: AttributeKey
): boolean {
  const cur = scores[key] ?? POINT_BUY_MIN;
  if (cur >= POINT_BUY_MAX_BEFORE_RACIAL) return false;
  return totalPointBuyCost(scores) + pointBuyIncreaseCost(scores, key) <= POINT_BUY_POOL;
}

export function canDecreasePointBuy(
  scores: Record<AttributeKey, number>,
  key: AttributeKey
): boolean {
  return (scores[key] ?? POINT_BUY_MIN) > POINT_BUY_MIN;
}

export function validatePointBuy(scores: Record<AttributeKey, number>): string | null {
  for (const key of ATTR_ORDER) {
    const v = scores[key];
    if (v < POINT_BUY_MIN || v > POINT_BUY_MAX_BEFORE_RACIAL) {
      return `Atributo ${key} fora do intervalo ${POINT_BUY_MIN}–${POINT_BUY_MAX_BEFORE_RACIAL}`;
    }
  }
  const spent = totalPointBuyCost(scores);
  if (spent > POINT_BUY_POOL) {
    return `Gastou ${spent} pontos (máx ${POINT_BUY_POOL})`;
  }
  if (spent < POINT_BUY_POOL) {
    return `Ainda restam ${POINT_BUY_POOL - spent} pontos para distribuir`;
  }
  return null;
}

/** Aplica bônus racial sobre scores da compra de pontos. */
export function attributesAfterRacial(
  base: Record<AttributeKey, number>,
  raceId: string,
  linhagem?: string | null
): Record<AttributeKey, number> {
  const out = { ...base };
  const race = getRace(raceId);
  if (!race) return out;

  const apply = (bonus: Partial<Record<AttributeKey, number>>) => {
    for (const [k, v] of Object.entries(bonus) as [AttributeKey, number][]) {
      out[k] = Math.min(20, (out[k] ?? 8) + v);
    }
  };

  if (race.fixedBonus) apply(race.fixedBonus);
  apply(race.attributeBonus);
  if (raceId === "Meio-Humano" && linhagem && race.linhagens) {
    const lin = race.linhagens.find((l) => l.id === linhagem);
    if (lin) apply(lin.attributeBonus);
  }
  return out;
}
