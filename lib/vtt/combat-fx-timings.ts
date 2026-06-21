import {
  COMBAT_DICE_TIMINGS,
  COMBAT_DICE_TIMINGS_REDUCED,
  DICE_LANDING_MS,
  DICE_LANDING_MS_REDUCED,
} from "@/lib/vtt/combat-dice-model";

export {
  DICE_LANDING_MS,
  DICE_LANDING_MS_REDUCED,
} from "@/lib/vtt/combat-dice-model";

/** Janela de rolagem do D20 / save — derivada do modelo único. */
export const COMBAT_ATTACK_ROLL_MS = COMBAT_DICE_TIMINGS.attackRoll;
export const COMBAT_ATTACK_ROLL_MS_REDUCED = COMBAT_DICE_TIMINGS_REDUCED.attackRoll;

/** Janela de rolagem do dado de dano. */
export const COMBAT_DAMAGE_ROLL_MS = COMBAT_DICE_TIMINGS.damageRoll;
export const COMBAT_DAMAGE_ROLL_MS_REDUCED = COMBAT_DICE_TIMINGS_REDUCED.damageRoll;

export function rollLandAtMs(rollMs: number, landingMs: number): number {
  return Math.max(0, rollMs - landingMs);
}

export type CombatFxTimings = {
  mark: number;
  attackRoll: number;
  attackLandAt: number;
  missHold: number;
  damageRoll: number;
  damageLandAt: number;
  afterResolve: number;
  healHold: number;
  areaTargetMark: number;
  areaSimulResult: number;
  areaSimulCleanup: number;
};

function buildTimings(
  dice: typeof COMBAT_DICE_TIMINGS,
  landingMs: number,
  extras: Pick<
    CombatFxTimings,
    "healHold" | "areaTargetMark" | "areaSimulResult" | "areaSimulCleanup"
  >
): CombatFxTimings {
  return {
    mark: dice.mark,
    attackRoll: dice.attackRoll,
    attackLandAt: rollLandAtMs(dice.attackRoll, landingMs),
    missHold: dice.missHold,
    damageRoll: dice.damageRoll,
    damageLandAt: rollLandAtMs(dice.damageRoll, landingMs),
    afterResolve: dice.afterResolve,
    ...extras,
  };
}

export const COMBAT_FX_TIMINGS = buildTimings(COMBAT_DICE_TIMINGS, DICE_LANDING_MS, {
  healHold: 380,
  areaTargetMark: 40,
  areaSimulResult: COMBAT_DICE_TIMINGS.attackRoll + COMBAT_DICE_TIMINGS.damageRoll,
  areaSimulCleanup: 260,
});

export const COMBAT_FX_TIMINGS_REDUCED = buildTimings(
  COMBAT_DICE_TIMINGS_REDUCED,
  DICE_LANDING_MS_REDUCED,
  {
    healHold: 160,
    areaTargetMark: 20,
    areaSimulResult:
      COMBAT_DICE_TIMINGS_REDUCED.attackRoll + COMBAT_DICE_TIMINGS_REDUCED.damageRoll,
    areaSimulCleanup: 140,
  }
);
