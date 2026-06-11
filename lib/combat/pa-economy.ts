import { PA_MAX_BY_TALENT, PASSIVE_PA } from "@/lib/character/pa-modifiers";
import type { CharacterSheet } from "@/lib/character/types";
import type { MonsterTier } from "@/lib/vtt/monsters";

/** Recuperação padrão no início do turno (mesa digital). */
export const PA_RECOVERY_PER_TURN = 5;

/** Máximo de PA acumulados no pool entre turnos (sobra). */
/** Teto de PA acumulados no pool entre turnos (Livro Cap. 2.6). */
export const PA_ACCUMULATION_CAP_DEFAULT = 9;

/** PA de recuperação / pool para monstros comuns. */
export const MONSTER_PA_DEFAULT = 6;

/** PA de recuperação / pool para bosses. */
export const MONSTER_PA_BOSS = 9;

/** Custo padrão de ataque (arma), magia de combate e habilidade (livro Cap. 3.1). */
export const PA_DEFAULT_ACTION_COST = 2;

/** @deprecated Alias — use `PA_RECOVERY_PER_TURN`. */
export const PA_BASE = PA_RECOVERY_PER_TURN;

export type PaTurnRules = {
  recoveryPerTurn: number;
  accumulationCap: number;
  /** Substitui sobra+recuperação (ex.: Canhão de Vidro = 7). */
  turnStartPa?: number;
  freeBasicMovePa?: boolean;
};

function hasTalent(sheet: CharacterSheet, talentId: string): boolean {
  return (sheet.identity.talentos ?? []).some((t) => t.id === talentId);
}

function paMaxBonusFromTalents(sheet: CharacterSheet): number {
  let bonus = 0;
  for (const [talentId, amount] of Object.entries(PA_MAX_BY_TALENT)) {
    if (!hasTalent(sheet, talentId)) continue;
    bonus += typeof amount === "number" ? amount : 0;
  }
  return bonus;
}

/** Recuperação por turno — só a nova regra (sem +1 por nível 5/10/15). */
export function paRecoveryPerTurn(_level: number, base = PA_RECOVERY_PER_TURN): number {
  return base;
}

/** @deprecated Use `paRecoveryPerTurn`. */
export function paMaxForLevel(level: number, base = PA_RECOVERY_PER_TURN): number {
  return paRecoveryPerTurn(level, base);
}

export function paTurnRulesForActor(sheet: CharacterSheet): PaTurnRules {
  let recoveryPerTurn = PA_RECOVERY_PER_TURN;
  let accumulationCap = PA_ACCUMULATION_CAP_DEFAULT;
  let turnStartPa: number | undefined;
  let freeBasicMovePa = false;

  for (const [talentId, rule] of Object.entries(PASSIVE_PA)) {
    if (!hasTalent(sheet, talentId)) continue;
    if (rule.recoveryPerTurn != null) recoveryPerTurn = rule.recoveryPerTurn;
    if (rule.recoveryPerTurnBonus != null) recoveryPerTurn += rule.recoveryPerTurnBonus;
    if (rule.accumulationCap != null) accumulationCap = rule.accumulationCap;
    if (rule.turnStartPa != null) turnStartPa = rule.turnStartPa;
    if (rule.freeBasicMovePa) freeBasicMovePa = true;
  }

  const talentPaBonus = paMaxBonusFromTalents(sheet);
  if (talentPaBonus > 0) {
    recoveryPerTurn += talentPaBonus;
    if (turnStartPa != null) turnStartPa += talentPaBonus;
    accumulationCap += talentPaBonus;
  }

  return { recoveryPerTurn, accumulationCap, turnStartPa, freeBasicMovePa };
}

export function paTurnRulesForMonster(tier?: MonsterTier): PaTurnRules {
  const recovery = tier === "boss" ? MONSTER_PA_BOSS : MONSTER_PA_DEFAULT;
  return {
    recoveryPerTurn: recovery,
    accumulationCap: 0,
    turnStartPa: recovery,
  };
}

/** Valor em `paMax` do token = recuperação por turno (não é teto de gasto). */
export function paMaxForActor(sheet: CharacterSheet): number {
  return paTurnRulesForActor(sheet).recoveryPerTurn;
}

/** @deprecated Alias — recuperação por turno, sem escala por nível. */
export function paMaxFor(level: number, base = PA_RECOVERY_PER_TURN): number {
  return paRecoveryPerTurn(level, base);
}

/** PA de movimento após O Peão (1 PA do bloco básico grátis, 1×/turno). */
export function effectiveMovementPaCost(
  token: import("@/lib/vtt/types").BattleToken,
  rawCost: number,
  freeBasicMovePa?: boolean
): number {
  if (!freeBasicMovePa || rawCost <= 0 || token.peaoFreeMoveUsed) return rawCost;
  return Math.max(0, rawCost - 1);
}

export {
  PA_MIN_COST_AFTER_REDUCTION,
  effectivePaCost,
  paCostForToken,
  formatPaCostLabel,
  listPaModifiersForActor,
  mergePaCostContext,
  paCostContextFromToken,
  totalAttackPaCost,
  warriorFlatWeaponPaPerHit,
  weaponAttackCount,
  weaponAttackPaIndex,
  type PaCostContext,
} from "@/lib/combat/pa-cost-reduce";
