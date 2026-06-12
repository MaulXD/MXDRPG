import type { AttributeKey } from "@/lib/character/rules";
import type { CompendiumPackId } from "@/lib/compendium/types";
import type { SpellAreaShape } from "@/lib/combat/area-spell";
import type { SpellEffectKind } from "@/lib/combat/spell-parse";
import type { RechargeSpec } from "@/lib/combat/recharge";
import type { TokenCondition } from "@/lib/combat/conditions";
import type { EquipmentSpecial } from "@/lib/combat/equipment-effects";

/** Ação equipada na mesa — arma, magia ou habilidade do compêndio */
export type CombatLoadout = {
  packId: "armas" | "magias" | "habilidades";
  entryId: string;
};

export type CombatActionKind = "weapon" | "spell" | "unarmed" | "ability";

export type CombatResolution = "attack" | "save";

export type AbilityEffect =
  | "melee_attack_bonus"
  | "defense_buff"
  | "charge"
  | "shadow_step"
  | "mark"
  | "mark_disadvantage"
  | "spell_strike"
  | "heal_touch"
  | "restrain"
  | "reaction_shift"
  | "wild_shape"
  | "ally_inspire"
  | "ranged_advantage";

export type CombatActionOption = {
  packId: CompendiumPackId | "unarmed";
  entryId: string;
  name: string;
  kind: CombatActionKind;
  resolution: CombatResolution;
  damageFormula: string;
  damageType: string;
  attackBonus: number;
  rangeHex: number;
  paCost: number;
  label: string;
  /** Magia com save — alvo rola vs CD */
  saveAttribute?: AttributeKey;
  saveDc?: number;
  /** Habilidade tática */
  abilityEffect?: AbilityEffect;
  /** Alvo próprio (sem alvo inimigo) */
  selfTarget?: boolean;
  /** Aliado linkado (cura, inspiração) */
  allyTarget?: boolean;
  /** Bônus de defesa da habilidade (Escudo +3) */
  defesaBuffAmount?: number;
  /** Dano soma mod de atributo (Raio Arcano +INT) */
  damageAttribute?: AttributeKey;
  /** Dano extra na habilidade (Canalizar +2d6) */
  bonusDamageFormula?: string;
  /** Área da magia */
  areaShape?: SpellAreaShape;
  areaRadiusHex?: number;
  areaHexCount?: number;
  /** Alvos individuais (ex.: 3 raios) — seleção múltipla na mesa */
  targetCount?: number;
  /** Propriedades mágicas / orgânicas (Cap. 14.8) */
  equipmentSpecials?: EquipmentSpecial[];
  /** Magia canalizável — até N PA extras na mesma conjuração */
  channelMaxExtraPa?: number;
  channelBonusPerPa?: string;
  /** Recarga do compêndio (1/turno, 1/combate, …) */
  recharge?: RechargeSpec;
  /** Efeito utilitário / cura / debuff de magia */
  spellEffect?: SpellEffectKind;
  /** Nível do círculo (0 = truque) */
  spellLevel?: number;
  /** Escola arcana */
  spellSchool?: string;
};

export type CombatTurnOptions = {
  activeTokenId?: string | null;
  /** Mestre/admin pode agir fora do turno */
  bypassTurn?: boolean;
  combatRound?: number;
  combatHasOrder?: boolean;
};

export type CombatActionRequest = {
  packId?: "armas" | "magias" | "habilidades";
  entryId?: string;
  /** Golpe Flanqueador etc. */
  abilityAttackBonus?: number;
  /** Centro de magia de área */
  centerQ?: number;
  centerR?: number;
  /** Direção 0–5 (cone/linha) */
  areaDirection?: number;
  /** PA extras de canalização (0–2) */
  channelExtraPa?: number;
  /** Vários alvos da mesma conjuração */
  defenderTokenIds?: string[];
};

export type AttackModifier = {
  attackBonus?: number;
  /** Rótulo para chat (ex. "flanqueio +2") */
  label?: string;
  /** Força vantagem/desvantagem no d20 */
  rollMode?: import("@/lib/combat/d20").RollMode;
};

export type AttackMark = {
  targetId: string;
  bonus?: number;
  rangedOnly?: boolean;
  advantage?: boolean;
  /** Finta — atacante marcado sofre desvantagem no próximo ataque */
  attackerDisadvantage?: boolean;
};

