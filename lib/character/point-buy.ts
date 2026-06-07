import { classAttributePriority } from "@/lib/character/class-scales";
import type { AttributeKey } from "@/lib/character/rules";
import { getRace } from "@/lib/character/rules";

/** Eldarin Cap. 10 — compra de pontos (base 8, pool 27). */
export const POINT_BUY_POOL = 27;
export const POINT_BUY_MIN = 8;
/** Cap. 10 — máximo 15 antes dos bônus raciais. */
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

export function isBaselinePointBuy(scores: Record<AttributeKey, number>): boolean {
  return ATTR_ORDER.every((key) => (scores[key] ?? POINT_BUY_MIN) === POINT_BUY_MIN);
}

/** Bônus raciais somados (inclui linhagem de Meio-Humano). */
export function getRacialBonuses(
  raceId: string,
  linhagem?: string | null
): Partial<Record<AttributeKey, number>> {
  const race = getRace(raceId);
  if (!race) return {};

  const out: Partial<Record<AttributeKey, number>> = {};
  const merge = (bonus: Partial<Record<AttributeKey, number>>) => {
    for (const [key, value] of Object.entries(bonus) as [AttributeKey, number][]) {
      out[key] = (out[key] ?? 0) + value;
    }
  };

  if (race.fixedBonus) merge(race.fixedBonus);
  merge(race.attributeBonus);
  if (raceId === "Meio-Humano" && linhagem && race.linhagens) {
    const lin = race.linhagens.find((l) => l.id === linhagem);
    if (lin) merge(lin.attributeBonus);
  }
  return out;
}

/**
 * Prioridade de compra: atributos primários da classe primeiro;
 * em empate, quem recebe menos bônus racial (evita “desperdiçar” pontos).
 */
export function raceAwarePointBuyPriority(
  classe: string,
  raceId: string,
  linhagem?: string | null
): AttributeKey[] {
  const classPri = classAttributePriority(classe);
  const racial = getRacialBonuses(raceId, linhagem);
  const ordered = [...classPri, ...ATTR_ORDER.filter((k) => !classPri.includes(k))];
  const seen = new Set<AttributeKey>();
  const unique: AttributeKey[] = [];
  for (const key of ordered) {
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(key);
  }

  return unique.sort((a, b) => {
    const ia = classPri.indexOf(a);
    const ib = classPri.indexOf(b);
    const ca = ia < 0 ? 99 : ia;
    const cb = ib < 0 ? 99 : ib;
    if (ca !== cb) return ca - cb;
    return (racial[a] ?? 0) - (racial[b] ?? 0);
  });
}

/** Gasta os 27 pontos seguindo prioridade da classe. */
export function spendFullPointBuy(priorities: AttributeKey[]): Record<AttributeKey, number> {
  const scores = defaultPointBuyScores();
  let safety = 0;
  while (totalPointBuyCost(scores) < POINT_BUY_POOL && safety < 500) {
    safety++;
    let improved = false;
    const order = [...priorities, ...ATTR_ORDER];
    for (const key of order) {
      if (!canIncreasePointBuy(scores, key)) continue;
      const inc = pointBuyIncreaseCost(scores, key);
      if (totalPointBuyCost(scores) + inc <= POINT_BUY_POOL) {
        scores[key] = (scores[key] ?? POINT_BUY_MIN) + 1;
        improved = true;
        if (totalPointBuyCost(scores) === POINT_BUY_POOL) break;
      }
    }
    if (!improved) break;
  }
  return scores;
}

/** Distribuição sugerida (27 pts) por classe — prioriza atributos primários da ficha. */
export function suggestedPointBuyForClass(classe: string): Record<AttributeKey, number> {
  return spendFullPointBuy(classAttributePriority(classe));
}

/** Sugestão inteligente: classe + raça (e linhagem). */
export function suggestedPointBuyForClassAndRace(
  classe: string,
  raceId: string,
  linhagem?: string | null
): Record<AttributeKey, number> {
  return spendFullPointBuy(raceAwarePointBuyPriority(classe, raceId, linhagem));
}

/** @deprecated Use isBaselinePointBuy — custo 0 também significa baseline 8 em tudo. */
export function isUnsetPointBuy(scores: Record<AttributeKey, number>): boolean {
  return totalPointBuyCost(scores) === 0;
}

export function isCompletePointBuy(scores: Record<AttributeKey, number>): boolean {
  return totalPointBuyCost(scores) === POINT_BUY_POOL;
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
