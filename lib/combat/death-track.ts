import { addCondition, hasCondition, removeCondition } from "@/lib/combat/conditions";
import type { BattleToken } from "@/lib/vtt/types";

export const DEATH_TRACK_MIN = -1;
export const DEATH_TRACK_FATAL = 10;

/** Ao cair em 0 HP: inconsciente; contador inicia em −1. */
export function applyUnconsciousAtZeroHp(token: BattleToken): BattleToken {
  if (token.vidaMax == null) return token;
  const hp = token.vida ?? 0;
  if (hp > 0) {
    if (token.deathTurns != null || hasCondition(token, "inconsciente")) {
      let next: BattleToken = { ...token, deathTurns: undefined };
      next = removeCondition(next, "inconsciente");
      return next;
    }
    return token;
  }

  let next: BattleToken = {
    ...token,
    defeated: undefined,
    deathTurns: token.deathTurns ?? DEATH_TRACK_MIN,
  };
  if (!hasCondition(next, "inconsciente")) {
    next = addCondition(next, "inconsciente");
  }
  return next;
}

/** Dano extra em 0 HP não piora além de −1. */
export function clampDeathTrackOnDamage(token: BattleToken, _damage: number): BattleToken {
  if ((token.vida ?? 0) > 0) return token;
  if (token.deathTurns == null) return applyUnconsciousAtZeroHp(token);
  if (token.deathTurns < DEATH_TRACK_MIN) {
    return { ...token, deathTurns: DEATH_TRACK_MIN };
  }
  return token;
}

/** +1 por rodada sem cura; em 10 → morto. */
export function tickDeathTrackOnRound(token: BattleToken): BattleToken {
  if (token.deathTurns == null) return token;
  if ((token.vida ?? 0) > 0) return token;

  const next = token.deathTurns + 1;
  if (next >= DEATH_TRACK_FATAL) {
    return {
      ...token,
      deathTurns: next,
      defeated: true,
      conditions: (token.conditions ?? []).filter((c) => c !== "inconsciente"),
    };
  }
  return { ...token, deathTurns: next };
}
