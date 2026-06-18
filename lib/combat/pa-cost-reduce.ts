import {
  CLASS_PA_FEATURES,
  PA_COST_REDUCE,
  paDiscountKindForAction,
  type ClassPaFeature,
  type CostReduceRule,
  type PaDiscountKind,
} from "@/lib/character/pa-modifiers";
import type { CharacterSheet } from "@/lib/character/types";
import { extraAttackCount } from "@/lib/character/rules";
import { isPaDiscountAvailable, readPaDiscountUsed } from "@/lib/combat/pa-turn-discount";
import type { CombatActionOption } from "@/lib/combat/types";
import type { BattleToken } from "@/lib/vtt/types";

/** Piso após reduções (livro Cap. 3.1 — ex.: 2 − 1 − 1 = 0 PA na 1ª magia). */
export const PA_MIN_COST_AFTER_REDUCTION = 0;

export type PaCostContext = {
  attackIndex?: number;
  attackCount?: number;
  paDiscountUsed?: Partial<Record<PaDiscountKind, boolean>>;
};

export function paCostContextFromToken(token?: BattleToken | null): PaCostContext | undefined {
  if (!token) return undefined;
  return { paDiscountUsed: readPaDiscountUsed(token) };
}

export function mergePaCostContext(
  token?: BattleToken | null,
  extra?: PaCostContext
): PaCostContext | undefined {
  const base = paCostContextFromToken(token);
  if (!base && !extra) return undefined;
  return { ...base, ...extra };
}

function hasTalent(sheet: CharacterSheet, talentId: string): boolean {
  return (sheet.identity.talentos ?? []).some((t) => t.id === talentId);
}

function actionDiscountKind(action: CombatActionOption): PaDiscountKind | null {
  return paDiscountKindForAction(action.kind);
}

function actionMatchesRuleKinds(action: CombatActionOption, kinds: PaDiscountKind[]): boolean {
  if (kinds.includes(action.kind as PaDiscountKind)) return true;
  return action.kind === "unarmed" && kinds.includes("weapon");
}

function firstDiscountAvailable(
  ctx: PaCostContext | undefined,
  kind: PaDiscountKind | null
): boolean {
  if (!kind) return true;
  if (!ctx?.paDiscountUsed) return true;
  return !ctx.paDiscountUsed[kind];
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
  if (!actionMatchesRuleKinds(action, rule.kinds)) return false;
  if (rule.classIds?.length && !rule.classIds.includes(sheet.identity.classe)) return false;
  const discountKind = actionDiscountKind(action);
  if (rule.firstPerTurn !== false && !firstDiscountAvailable(ctx, discountKind)) return false;
  const isWeaponLike = action.kind === "weapon" || action.kind === "unarmed";
  const weaponHitCap = rule.weaponHitCap ?? (rule.firstWeaponHitOnly === false ? 99 : 1);
  if (isWeaponLike && (ctx?.attackIndex ?? 1) > weaponHitCap) return false;
  if (rule.rangedOnly && action.rangeCells <= 1) return false;
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

function classFeatureApplies(
  feat: ClassPaFeature,
  sheet: CharacterSheet,
  action: CombatActionOption,
  ctx?: PaCostContext
): boolean {
  const { classe, nivel } = sheet.identity;
  if (!feat.classIds.includes(classe)) return false;
  if (nivel < feat.minLevel) return false;
  if (!actionMatchesRuleKinds(action, feat.kinds)) return false;
  if (feat.minPaCost != null && action.paCost < feat.minPaCost) return false;
  if (feat.firstPerTurn !== false && !firstDiscountAvailable(ctx, actionDiscountKind(action))) return false;
  return true;
}

function classFeatureCostReduction(
  sheet: CharacterSheet,
  action: CombatActionOption,
  ctx?: PaCostContext
): number {
  let reduce = 0;
  for (const feat of CLASS_PA_FEATURES) {
    if (!classFeatureApplies(feat, sheet, action, ctx)) continue;
    reduce = Math.max(reduce, feat.amount);
  }
  return reduce;
}

/** Guerreiro nv5+: Ataque Extra — cada golpe custa PA normal (2); talentos reduzem por golpe. */
export function warriorFlatWeaponPaPerHit(_classId: string, _level: number): boolean {
  return false;
}

export function weaponAttackCount(actor: CharacterSheet, action: CombatActionOption): number {
  if (action.kind !== "weapon") return 1;
  return extraAttackCount(actor.identity.classe, actor.identity.nivel);
}

/** Índice do golpe para desconto −PA: 1º com desconto disponível, senão preço integral (2º golpe lógico). */
export function weaponAttackPaIndex(
  token: BattleToken | null | undefined,
  action: CombatActionOption,
  explicitIndex?: number,
  actor?: CharacterSheet | null
): number {
  if (explicitIndex != null) return explicitIndex;
  if (action.kind !== "weapon" && action.kind !== "unarmed") return 1;
  if (actor && weaponAttackCount(actor, action) > 1) return 1;
  if (!token) return 1;
  return isPaDiscountAvailable(token, "weapon") ? 1 : 2;
}

/** PA efetivo no turno atual (talentos, 1×/turno, índice de golpe). */
export function paCostForToken(
  actor: CharacterSheet | null,
  action: CombatActionOption,
  token?: BattleToken | null
): number {
  return effectivePaCost(actor, action, paCostContextFromToken(token));
}

export function effectivePaCost(
  actor: CharacterSheet | null,
  action: CombatActionOption,
  ctx?: PaCostContext
): number {
  if (!actor) return Math.max(0, action.paCost);

  let cost = action.paCost;

  const reduce =
    talentCostReduction(actor, action, ctx) + classFeatureCostReduction(actor, action, ctx);

  const floor = action.paCost <= 0 ? 0 : PA_MIN_COST_AFTER_REDUCTION;
  return Math.max(floor, cost - reduce);
}

export function totalAttackPaCost(
  actor: CharacterSheet | null,
  action: CombatActionOption,
  token?: BattleToken | null
): number {
  const baseCtx = paCostContextFromToken(token);
  if (!actor || action.kind !== "weapon") {
    return effectivePaCost(actor, action, baseCtx);
  }
  const count = weaponAttackCount(actor, action);
  if (count <= 1) {
    const attackIndex = weaponAttackPaIndex(token, action, undefined, actor);
    return effectivePaCost(
      actor,
      action,
      mergePaCostContext(token, { attackIndex, attackCount: 1 })
    );
  }

  let sum = 0;
  for (let i = 1; i <= count; i++) {
    sum += effectivePaCost(actor, action, mergePaCostContext(token, { attackIndex: i, attackCount: count }));
  }
  return sum;
}

export function formatPaCostLabel(
  actor: CharacterSheet | null,
  action: CombatActionOption,
  token?: BattleToken | null
): string {
  const baseCtx = paCostContextFromToken(token);
  if (!actor || action.kind !== "weapon") {
    return `PA ${effectivePaCost(actor, action, baseCtx)}`;
  }
  const count = weaponAttackCount(actor, action);
  if (count <= 1) return `PA ${effectivePaCost(actor, action, baseCtx)}`;
  const total = totalAttackPaCost(actor, action, token);
  const perHit = effectivePaCost(
    actor,
    action,
    mergePaCostContext(token, { attackIndex: 1, attackCount: count })
  );
  return `PA ${total} (${count}×${perHit})`;
}

export function listPaModifiersForActor(
  sheet: CharacterSheet,
  action: CombatActionOption,
  ctx?: PaCostContext
): string[] {
  const notes: string[] = [];
  for (const feat of CLASS_PA_FEATURES) {
    if (!classFeatureApplies(feat, sheet, action, ctx)) continue;
    notes.push(feat.id);
  }
  for (const rule of PA_COST_REDUCE) {
    if (ruleApplies(rule, sheet, action, ctx)) notes.push(rule.talentId);
  }
  if (action.kind === "weapon" && warriorFlatWeaponPaPerHit(sheet.identity.classe, sheet.identity.nivel)) {
    notes.push("ataque-extra-guerreiro");
  }
  return notes;
}

const DISCOUNT_KIND_LABEL: Record<PaDiscountKind, string> = {
  weapon: "1º ataque",
  spell: "1ª magia",
  ability: "1ª habilidade",
};

export function describePaDiscountNote(
  token: BattleToken,
  action: CombatActionOption,
  modifierIds: string[]
): string | null {
  if (modifierIds.length === 0) return null;
  const kind = actionDiscountKind(action);
  if (!kind) return null;
  const used = readPaDiscountUsed(token);
  if (used[kind]) return null;
  const primary = modifierIds[0]!.replace(/-/g, " ");
  return `${DISCOUNT_KIND_LABEL[kind]} · ${primary}`;
}
