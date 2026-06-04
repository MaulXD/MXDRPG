import type { MonsterTier } from "@/lib/vtt/monsters";
import { MONSTER_PA_BOSS, MONSTER_PA_DEFAULT } from "@/lib/combat/pa-economy";

/** PA mínimo de monstro comum / mini na mesa digital. */
export const MONSTER_PA_MIN = MONSTER_PA_DEFAULT;

export function defaultMonsterPaForTier(tier: MonsterTier): number {
  return tier === "boss" ? MONSTER_PA_BOSS : MONSTER_PA_DEFAULT;
}

export function normalizeMonsterPa(
  paMax: number,
  pa: number = paMax,
  tier?: MonsterTier
): { pa: number; paMax: number } {
  const floor = tier ? defaultMonsterPaForTier(tier) : MONSTER_PA_MIN;
  const max = Math.max(floor, Math.floor(paMax));
  const value = Math.max(floor, Math.min(max, Math.floor(pa)));
  return { pa: value, paMax: max };
}
