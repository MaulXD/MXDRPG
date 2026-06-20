import type { AreaCascadeMode } from "@/lib/combat/area-cascade";
import type { Axial } from "@/lib/vtt/grid-math";
import type { TokenCastFxKind } from "@/lib/vtt/token-cast-fx";

export type CombatFxPhase = "mark" | "roll" | "result" | "damage" | "done";

export type CombatFxMode = "single" | "area-intro" | "area-target" | "area-simultaneous";

export type CombatFxTargetBurst = {
  tokenId: string;
  axial: Axial;
  attackNatural?: number;
  attackTotal?: number;
  defenderAc?: number;
  saveTotal?: number;
  saveDc?: number;
  saveSuccess?: boolean;
  hit?: boolean;
  critical?: boolean;
  isHeal?: boolean;
  damageTotal: number | null;
  detail?: string;
};

export type CombatFxState = {
  id: string;
  mode: CombatFxMode;
  phase: CombatFxPhase;
  markAxial: Axial;
  defenderAxial: Axial;
  attackerAxial?: Axial;
  attackerTokenId?: string;
  defenderTokenId?: string;
  actionKind: "weapon" | "spell" | "unarmed" | "ability";
  attackNatural?: number;
  attackTotal?: number;
  defenderAc?: number;
  hit?: boolean;
  critical?: boolean;
  criticalFail?: boolean;
  saveTotal?: number;
  saveDc?: number;
  saveSuccess?: boolean;
  damageTotal: number | null;
  isHeal?: boolean;
  castFxKind?: TokenCastFxKind | null;
  castFxTargetId?: string | null;
  deferStateApply?: boolean;
  spellName?: string;
  resolveDetail?: string;
  damageTypeLabel?: string;
  spellDamageType?: string;
  areaCells?: Axial[];
  areaCascade?: AreaCascadeMode;
  areaTargets?: CombatFxTargetBurst[];
  cascadeIndex?: number;
  cascadeTotal?: number;
  /** IDs de mensagens do chat vinculadas a esta animação (revelação em fases). */
  chatMessageIds?: string[];
};
