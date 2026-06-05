import paModifiers from "@/data/character/pa-modifiers.json";
import type { CharacterSheet } from "@/lib/character/types";
import { extraAttackCount } from "@/lib/character/rules";
import type { CombatActionOption } from "@/lib/combat/types";
import type { MonsterTier } from "@/lib/vtt/monsters";

/** Recuperação padrão no início do turno (mesa digital). */
export const PA_RECOVERY_PER_TURN = 5;

/** Máximo de PA acumulados no pool entre turnos (sobra). */
export const PA_ACCUMULATION_CAP_DEFAULT = 9;

/** PA de recuperação / pool para monstros comuns. */
export const MONSTER_PA_DEFAULT = 6;

/** PA de recuperação / pool para bosses. */
export const MONSTER_PA_BOSS = 9;

/** Custo padrão de ataque (arma), magia de combate e habilidade (livro Cap. 3.1). */
export const PA_DEFAULT_ACTION_COST = 2;

/** Piso após reduções de talento/classe — evita magias ofensivas a 0 PA. */
export const PA_MIN_COST_AFTER_REDUCTION = 1;

/** @deprecated Alias — use `PA_RECOVERY_PER_TURN`. */
export const PA_BASE = PA_RECOVERY_PER_TURN;

export type PaTurnRules = {
  recoveryPerTurn: number;
  accumulationCap: number;
  /** Substitui sobra+recuperação (ex.: Canhão de Vidro = 7). */
  turnStartPa?: number;
  freeBasicMovePa?: boolean;
};

type PassivePaRule = {
  recoveryPerTurn?: number;
  accumulationCap?: number;
  turnStartPa?: number;
  freeBasicMovePa?: boolean;
};

type PaModifiersFile = {
  passivePa?: Record<string, PassivePaRule>;
  paMaxByTalent?: Record<string, number>;
  costReduce?: unknown[];
  classFeatures?: unknown[];
};

const PASSIVE_PA = (paModifiers as PaModifiersFile).passivePa ?? {};
const PA_MAX_BY_TALENT = (paModifiers as PaModifiersFile).paMaxByTalent ?? {};

function paMaxBonusFromTalents(sheet: CharacterSheet): number {
  let bonus = 0;
  for (const [talentId, amount] of Object.entries(PA_MAX_BY_TALENT)) {
    if (!hasTalent(sheet, talentId)) continue;
    bonus += typeof amount === "number" ? amount : 0;
  }
  return bonus;
}

export type PaCostContext = {
  attackIndex?: number;
  attackCount?: number;
};

type CostReduceRule = {
  talentId: string;
  kinds: CombatActionOption["kind"][];
  amount: number;
  firstWeaponHitOnly?: boolean;
  damageTypes?: string[];
  areaOnly?: boolean;
  minPaCost?: number;
  classIds?: string[];
};

type ClassPaFeature = {
  id: string;
  classIds: string[];
  minLevel: number;
  kinds: CombatActionOption["kind"][];
  amount: number;
  minPaCost?: number;
};

const PA_COST_REDUCE = paModifiers.costReduce as CostReduceRule[];
const CLASS_PA_FEATURES = paModifiers.classFeatures as ClassPaFeature[];

function hasTalent(sheet: CharacterSheet, talentId: string): boolean {
  return (sheet.identity.talentos ?? []).some((t) => t.id === talentId);
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
    accumulationCap: recovery,
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

function normalizeDamageTag(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesDamageType(action: CombatActionOption, types?: string[]): boolean {
  if (!types?.length) return true;
  const tag = normalizeDamageTag(action.damageType);
  return types.some((t) => tag.includes(normalizeDamageTag(t)));
}

function ruleApplies(
  rule: CostReduceRule,
  sheet: CharacterSheet,
  action: CombatActionOption,
  ctx?: PaCostContext
): boolean {
  if (!hasTalent(sheet, rule.talentId)) return false;
  if (!rule.kinds.includes(action.kind)) return false;
  if (rule.classIds?.length && !rule.classIds.includes(sheet.identity.classe)) return false;
  if (rule.firstWeaponHitOnly && (ctx?.attackIndex ?? 1) !== 1) return false;
  if (rule.areaOnly && (!action.areaShape || action.areaShape === "single")) return false;
  if (rule.minPaCost != null && action.paCost < rule.minPaCost) return false;
  if (!matchesDamageType(action, rule.damageTypes)) return false;
  return true;
}

function talentCostReduction(
  sheet: CharacterSheet,
  action: CombatActionOption,
  ctx?: PaCostContext
): number {
  let reduce = 0;
  for (const rule of PA_COST_REDUCE) {
    if (!ruleApplies(rule, sheet, action, ctx)) continue;
    reduce = Math.max(reduce, rule.amount);
  }
  return reduce;
}

function classFeatureCostReduction(sheet: CharacterSheet, action: CombatActionOption): number {
  const { classe, nivel } = sheet.identity;
  let reduce = 0;
  for (const feat of CLASS_PA_FEATURES) {
    if (!feat.classIds.includes(classe)) continue;
    if (nivel < feat.minLevel) continue;
    if (!feat.kinds.includes(action.kind)) continue;
    if (feat.minPaCost != null && action.paCost < feat.minPaCost) continue;
    reduce = Math.max(reduce, feat.amount);
  }
  return reduce;
}

/** Guerreiro nv5+: cada golpe de Ataque Extra custa 1 PA. */
export function warriorFlatWeaponPaPerHit(classId: string, level: number): boolean {
  return classId === "Guerreiro" && level >= 5;
}

export function weaponAttackCount(actor: CharacterSheet, action: CombatActionOption): number {
  if (action.kind !== "weapon") return 1;
  return extraAttackCount(actor.identity.classe, actor.identity.nivel);
}

export function effectivePaCost(
  actor: CharacterSheet | null,
  action: CombatActionOption,
  ctx?: PaCostContext
): number {
  if (!actor) return Math.max(0, action.paCost);

  let cost = action.paCost;

  if (action.kind === "weapon" && warriorFlatWeaponPaPerHit(actor.identity.classe, actor.identity.nivel)) {
    cost = 1;
  }

  const reduce =
    talentCostReduction(actor, action, ctx) +
    classFeatureCostReduction(actor, action);

  if (action.kind === "weapon" && hasTalent(actor, "tiro-de-precisao")) {
    if (action.rangeHex > 1) cost = Math.max(0, cost - 1);
  }

  const floor = action.paCost <= 0 ? 0 : PA_MIN_COST_AFTER_REDUCTION;
  return Math.max(floor, cost - reduce);
}

export function totalAttackPaCost(actor: CharacterSheet | null, action: CombatActionOption): number {
  if (!actor || action.kind !== "weapon") {
    return effectivePaCost(actor, action);
  }
  const count = weaponAttackCount(actor, action);
  if (count <= 1) return effectivePaCost(actor, action, { attackIndex: 1, attackCount: 1 });

  let sum = 0;
  for (let i = 1; i <= count; i++) {
    sum += effectivePaCost(actor, action, { attackIndex: i, attackCount: count });
  }
  return sum;
}

export function formatPaCostLabel(actor: CharacterSheet | null, action: CombatActionOption): string {
  if (!actor || action.kind !== "weapon") {
    return `PA ${effectivePaCost(actor, action)}`;
  }
  const count = weaponAttackCount(actor, action);
  if (count <= 1) return `PA ${effectivePaCost(actor, action)}`;
  const total = totalAttackPaCost(actor, action);
  const perHit = effectivePaCost(actor, action, { attackIndex: 1, attackCount: count });
  return `PA ${total} (${count}×${perHit})`;
}

export function listPaModifiersForActor(sheet: CharacterSheet, action: CombatActionOption): string[] {
  const notes: string[] = [];
  for (const feat of CLASS_PA_FEATURES) {
    if (!feat.classIds.includes(sheet.identity.classe)) continue;
    if (sheet.identity.nivel < feat.minLevel) continue;
    if (!feat.kinds.includes(action.kind)) continue;
    if (feat.minPaCost != null && action.paCost < feat.minPaCost) continue;
    notes.push(feat.id);
  }
  for (const rule of PA_COST_REDUCE) {
    if (ruleApplies(rule, sheet, action)) notes.push(rule.talentId);
  }
  if (action.kind === "weapon" && warriorFlatWeaponPaPerHit(sheet.identity.classe, sheet.identity.nivel)) {
    notes.push("ataque-extra-guerreiro");
  }
  return notes;
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
