/** Eldarin v4 — experiencia (espelha Livro do Jogador Cap. 2.5) */

export const MAX_LEVEL = 20;

/** XP total minimo para *estar* no nivel N (N>=1) */
export function xpTotalForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

/** XP que falta do total atual ate o proximo nivel */
export function xpToNextLevel(currentLevel: number, xpTotal: number): number {
  if (currentLevel >= MAX_LEVEL) return 0;
  const next = xpTotalForLevel(currentLevel + 1);
  return Math.max(0, next - xpTotal);
}

/** XP de um especime derrotado (pool; dividir entre participantes) */
export function xpFromMonster(monsterLevel: number, options?: { elite?: boolean; banquet?: boolean }): number {
  const m = Math.max(1, Math.min(MAX_LEVEL, Math.floor(monsterLevel)));
  let xp = 100 * m;
  if (options?.elite) xp = Math.round(xp * 1.5);
  if (options?.banquet) xp = Math.round(xp * 1.25);
  return xp;
}

/** Reduz XP quando o grupo esta muito acima do monstro (N medio - M) */
export function xpMultiplierForLevelGap(partyLevel: number, monsterLevel: number): number {
  const gap = partyLevel - monsterLevel;
  if (gap >= 4) return 0.25;
  if (gap >= 2) return 0.5;
  if (gap <= -2) return 1.25;
  return 1;
}

export function canAdvanceLevel(level: number, xpTotal: number): boolean {
  if (level >= MAX_LEVEL) return false;
  return xpTotal >= xpTotalForLevel(level + 1);
}

export function formatXpProgress(level: number, xpTotal: number): string {
  if (level >= MAX_LEVEL) return `${xpTotal} XP · max`;
  const next = xpTotalForLevel(level + 1);
  return `${xpTotal} / ${next} XP`;
}

/** 0–1 para barra de XP no nível atual */
export function xpProgressRatio(level: number, xpTotal: number): number {
  if (level >= MAX_LEVEL) return 1;
  const prev = xpTotalForLevel(level);
  const next = xpTotalForLevel(level + 1);
  if (next <= prev) return 0;
  return Math.min(1, Math.max(0, (xpTotal - prev) / (next - prev)));
}
