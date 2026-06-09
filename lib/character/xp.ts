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

export type MonsterXpVariantReward = {
  variant: "normal" | "elite" | "colossal";
  label: string;
  threatLevel: number;
  poolXp: number;
  detail: string;
};

/** Recompensa de XP por variante de spawn (Cap. XII simplificado). */
export function monsterXpRewardsForThreat(baseThreat: number): MonsterXpVariantReward[] {
  const base = Math.max(1, Math.min(MAX_LEVEL, Math.floor(baseThreat)));
  return [
    {
      variant: "normal",
      label: "Padrão",
      threatLevel: base,
      poolXp: xpFromMonster(base),
      detail: `100 × ameaça ${base}`,
    },
    {
      variant: "elite",
      label: "Elite",
      threatLevel: Math.min(MAX_LEVEL, base + 1),
      poolXp: xpFromMonster(Math.min(MAX_LEVEL, base + 1), { elite: true }),
      detail: `ameaça +1 · bônus +50%`,
    },
    {
      variant: "colossal",
      label: "Colossal",
      threatLevel: Math.min(MAX_LEVEL, base + 2),
      poolXp: xpFromMonster(Math.min(MAX_LEVEL, base + 2)),
      detail: `ameaça +2`,
    },
  ];
}

/** Multiplicadores quando o nível médio do grupo difere da ameaça do monstro. */
export const XP_LEVEL_GAP_HINTS: ReadonlyArray<{ gap: string; multiplier: string }> = [
  { gap: "Grupo 4+ níveis acima", multiplier: "25% do pool" },
  { gap: "Grupo 2–3 níveis acima", multiplier: "50% do pool" },
  { gap: "Diferença normal", multiplier: "100% do pool" },
  { gap: "Grupo 2+ níveis abaixo", multiplier: "125% do pool" },
];

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
  if (level >= MAX_LEVEL) return "Ascensão";
  const prev = xpTotalForLevel(level);
  const next = xpTotalForLevel(level + 1);
  const band = next - prev;
  const progress = Math.max(0, xpTotal - prev);
  if (xpTotal >= next) return `↑ nv ${level + 1}`;
  return `${progress} / ${band} XP`;
}

/** Texto rico para bloco de nível/XP na ficha popup */
export function formatXpProgressDetail(
  level: number,
  xpTotal: number
): { primary: string; secondary: string; barLabel: string } {
  if (level >= MAX_LEVEL) {
    return {
      primary: "Ascensão",
      secondary: `${xpTotal.toLocaleString("pt-BR")} XP acumulados`,
      barLabel: "Capstone nv. 20",
    };
  }
  const remaining = xpToNextLevel(level, xpTotal);
  const prev = xpTotalForLevel(level);
  const band = xpTotalForLevel(level + 1) - prev;
  const progress = Math.max(0, xpTotal - prev);
  if (remaining === 0) {
    return {
      primary: `${progress} / ${band} XP`,
      secondary: `Pronto para subir ao nv. ${level + 1}`,
      barLabel: `↑ nv ${level + 1}`,
    };
  }
  return {
    primary: `${progress} / ${band} XP`,
    secondary: `Faltam ${remaining.toLocaleString("pt-BR")} XP para o nv. ${level + 1}`,
    barLabel: `${xpTotal.toLocaleString("pt-BR")} XP total`,
  };
}

/** 0–1 para barra de XP no nível atual */
export function xpProgressRatio(level: number, xpTotal: number): number {
  if (level >= MAX_LEVEL) return 1;
  const prev = xpTotalForLevel(level);
  const next = xpTotalForLevel(level + 1);
  if (next <= prev) return 0;
  return Math.min(1, Math.max(0, (xpTotal - prev) / (next - prev)));
}
