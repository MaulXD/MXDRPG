import raw from "@/data/character/pa-modifiers.json";
import type { CombatActionOption } from "@/lib/combat/types";

export type PaDiscountKind = "weapon" | "spell" | "ability";

export function paDiscountKindForAction(kind: CombatActionOption["kind"]): PaDiscountKind | null {
  if (kind === "unarmed") return "weapon";
  if (kind === "weapon" || kind === "spell" || kind === "ability") return kind;
  return null;
}

export type PassivePaRule = {
  recoveryPerTurn?: number;
  /** Soma à recuperação base (ex.: Aceleração +1 PA/turno). */
  recoveryPerTurnBonus?: number;
  accumulationCap?: number;
  turnStartPa?: number;
  freeBasicMovePa?: boolean;
};

export type OnKillPaRule = {
  amount: number;
  incompatibleWith?: string[];
};

export type CostReduceRule = {
  talentId: string;
  kinds: PaDiscountKind[];
  amount: number;
  firstWeaponHitOnly?: boolean;
  weaponHitCap?: number;
  firstPerTurn?: boolean;
  rangedOnly?: boolean;
  damageTypes?: string[];
  areaOnly?: boolean;
  minPaCost?: number;
  classIds?: string[];
};

export type ClassPaFeature = {
  id: string;
  classIds: string[];
  minLevel: number;
  kinds: PaDiscountKind[];
  amount: number;
  minPaCost?: number;
  firstPerTurn?: boolean;
};

type CostReduceGroup = {
  talentId: string;
  kinds?: PaDiscountKind[];
  amount?: number;
  firstWeaponHitOnly?: boolean;
  firstPerTurn?: boolean;
  rangedOnly?: boolean;
  damageTypes?: string[];
  areaOnly?: boolean;
  minPaCost?: number;
  classIds?: string[];
};

type PaModifiersFile = {
  version: number;
  meta?: {
    costReduceDefaults?: {
      amount?: number;
      firstPerTurn?: boolean;
    };
  };
  passivePa?: Record<string, PassivePaRule>;
  onKillPa?: Record<string, OnKillPaRule>;
  paMaxByTalent?: Record<string, number>;
  classFeatures?: ClassPaFeature[];
  costReduce?: CostReduceRule[];
  costReduceByKind?: {
    weapon?: CostReduceGroup[];
    spell?: CostReduceGroup[];
    ability?: CostReduceGroup[];
    multi?: CostReduceGroup[];
  };
};

const file = raw as PaModifiersFile;

const COST_REDUCE_DEFAULTS = {
  amount: file.meta?.costReduceDefaults?.amount ?? 1,
  firstPerTurn: file.meta?.costReduceDefaults?.firstPerTurn ?? true,
};

function expandGroup(
  entries: CostReduceGroup[] | undefined,
  defaultKinds: PaDiscountKind[]
): CostReduceRule[] {
  if (!entries?.length) return [];
  return entries.map((entry) => ({
    talentId: entry.talentId,
    kinds: entry.kinds ?? defaultKinds,
    amount: entry.amount ?? COST_REDUCE_DEFAULTS.amount,
    firstPerTurn: entry.firstPerTurn ?? COST_REDUCE_DEFAULTS.firstPerTurn,
    firstWeaponHitOnly: entry.firstWeaponHitOnly,
    rangedOnly: entry.rangedOnly,
    damageTypes: entry.damageTypes,
    areaOnly: entry.areaOnly,
    minPaCost: entry.minPaCost,
    classIds: entry.classIds,
  }));
}

function flattenCostReduce(file: PaModifiersFile): CostReduceRule[] {
  if (file.costReduce?.length) return file.costReduce;
  const byKind = file.costReduceByKind;
  if (!byKind) return [];
  return [
    ...expandGroup(byKind.weapon, ["weapon"]),
    ...expandGroup(byKind.spell, ["spell"]),
    ...expandGroup(byKind.ability, ["ability"]),
    ...expandGroup(byKind.multi, []),
  ];
}

export const PA_MODIFIERS_VERSION = file.version;
export const PASSIVE_PA = file.passivePa ?? {};
export const ON_KILL_PA = file.onKillPa ?? {};
export const PA_MAX_BY_TALENT = file.paMaxByTalent ?? {};
export const CLASS_PA_FEATURES = file.classFeatures ?? [];
export const PA_COST_REDUCE = flattenCostReduce(file);
