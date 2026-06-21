/** Pouso do dado — encaixa no fim de cada janela de 2s. */
export const DICE_LANDING_MS = 450;
export const DICE_LANDING_MS_REDUCED = 140;

/** Janela de rolagem do D20 / save (spin + pouso). */
export const COMBAT_ATTACK_ROLL_MS = 1200;
export const COMBAT_ATTACK_ROLL_MS_REDUCED = 550;

/** Janela de rolagem do dado de dano (D20 permanece visível). */
export const COMBAT_DAMAGE_ROLL_MS = 1200;
export const COMBAT_DAMAGE_ROLL_MS_REDUCED = 550;

/** Quando parar de girar e iniciar pouso (ms desde o início da rolagem). */
export function rollLandAtMs(rollMs: number, landingMs: number): number {
  return Math.max(0, rollMs - landingMs);
}

export type CombatFxTimings = {
  /** Marca/projétil antes do dado */
  mark: number;
  /** Rolagem de ataque (total) */
  attackRoll: number;
  /** Quando o D20 para de girar */
  attackLandAt: number;
  /** ERROU visível antes de sair (sem dano) */
  missHold: number;
  /** Rolagem de dano (total) */
  damageRoll: number;
  /** Quando o dado de dano para de girar */
  damageLandAt: number;
  /** Após resolver (token + chat) antes do próximo FX */
  afterResolve: number;
  healHold: number;
  areaTargetMark: number;
  areaSimulResult: number;
  areaSimulCleanup: number;
};

function buildTimings(
  attackRoll: number,
  damageRoll: number,
  landingMs: number,
  extras: Pick<
    CombatFxTimings,
    "mark" | "missHold" | "afterResolve" | "healHold" | "areaTargetMark" | "areaSimulResult" | "areaSimulCleanup"
  >
): CombatFxTimings {
  return {
    ...extras,
    attackRoll,
    attackLandAt: rollLandAtMs(attackRoll, landingMs),
    damageRoll,
    damageLandAt: rollLandAtMs(damageRoll, landingMs),
  };
}

/** Hit completo ≈ mark + 1.2s ataque + 1.2s dano + afterResolve (~3s). */
export const COMBAT_FX_TIMINGS = buildTimings(
  COMBAT_ATTACK_ROLL_MS,
  COMBAT_DAMAGE_ROLL_MS,
  DICE_LANDING_MS,
  {
    mark: 180,
    missHold: 550,
    afterResolve: 400,
    healHold: 700,
    areaTargetMark: 160,
    areaSimulResult: COMBAT_ATTACK_ROLL_MS + COMBAT_DAMAGE_ROLL_MS,
    areaSimulCleanup: 500,
  }
);

export const COMBAT_FX_TIMINGS_REDUCED = buildTimings(
  COMBAT_ATTACK_ROLL_MS_REDUCED,
  COMBAT_DAMAGE_ROLL_MS_REDUCED,
  DICE_LANDING_MS_REDUCED,
  {
    mark: 60,
    missHold: 220,
    afterResolve: 200,
    healHold: 280,
    areaTargetMark: 60,
    areaSimulResult: COMBAT_ATTACK_ROLL_MS_REDUCED + COMBAT_DAMAGE_ROLL_MS_REDUCED,
    areaSimulCleanup: 240,
  }
);
