import { getEntry } from "@/lib/compendium/registry";
import { PA_DEFAULT_ACTION_COST } from "@/lib/combat/pa-economy";
import type { CompendiumEntry } from "@/lib/compendium/types";
import { rollDice } from "@/lib/dice/roll";
import {
  attributeMod,
  getClass,
  proficiencyBonus,
  type AttributeKey,
} from "@/lib/character/rules";
import type { CharacterSheet } from "@/lib/character/types";
import { getMonsterTemplate } from "@/lib/vtt/monsters";
import {
  goblinMonsterAttackModifier,
  goblinSneakAttackExtra,
  isGoblinMonster,
} from "@/lib/vtt/goblin-combat";
import { monsterCombatActions } from "@/lib/vtt/monster-actions";
import { isMonsterToken } from "@/lib/room/settings";
import type { BattleToken } from "@/lib/vtt/types";
import { tokenAxialDistance } from "@/lib/vtt/creature-size";
import { axialDistance } from "@/lib/vtt/hex-math";
import { resistedDamageAmount } from "@/lib/combat/damage-resist";
import { applyDamageWithTempHp } from "@/lib/combat/hp-temp";
import { abilityFromEntry } from "@/lib/combat/compendium-actions";
import { attackRollMode, canTokenAct } from "@/lib/combat/conditions";
import { clearTimedEffectsForFields } from "@/lib/combat/timed-effects";
import { combineRollModes, formatD20Detail, formatRollMode, rollD20, type RollMode } from "@/lib/combat/d20";
import { isAreaSpellAction, parseAreaShape } from "@/lib/combat/area-spell";
import { buildMagiaCombatAction } from "@/lib/combat/spell-parse";
import { isSpellCombatReady } from "@/lib/character/spell-prep";
import { listSubclassCombatActions } from "@/lib/character/subclass-vtt";
import {
  appendHealToSummary,
  applyEquipmentOnHitEffects,
  mergeBonusIntoDamage,
  normalizeWeaponSpecial,
} from "@/lib/combat/equipment-effects";
import { resolveSpellPaCost } from "@/lib/combat/pa-balance";
import {
  effectivePaCost,
  mergePaCostContext,
  paCostContextFromToken,
  totalAttackPaCost,
  weaponAttackCount,
  weaponAttackPaIndex,
} from "@/lib/combat/pa-economy";
import { checkCanSpendPa } from "@/lib/combat/pa-turn";
import { canActOnCombatTurn, TURN_WAIT_MSG } from "@/lib/combat/turn-guard";
import { parseRecharge, rechargeBlockReason } from "@/lib/combat/recharge";
import {
  actionWithChannel,
  clampChannelExtraPa,
  parseSpellChannel,
  totalChannelPaCost,
} from "@/lib/combat/spell-channel";
import type {
  AttackMark,
  AttackModifier,
  CombatActionKind,
  CombatActionOption,
  CombatActionRequest,
  CombatLoadout,
  CombatResolution,
  CombatTurnOptions,
} from "@/lib/combat/types";

export type { CombatLoadout, CombatActionOption, CombatTurnOptions, CombatActionRequest };

/** @deprecated use CombatActionOption */
export type ResolvedWeapon = CombatActionOption;

export type AttackRollBreakdown = {
  natural: number;
  attributeMod: number;
  profBonus: number;
  weaponBonus: number;
  total: number;
  attributeLabel: string;
  rollMode: RollMode;
  d20Detail: string;
};

export type DamageBreakdown = {
  formula: string;
  rolls: number[];
  attributeMod: number;
  total: number;
  doubled: boolean;
};

export type AttackResolution = {
  attackerTokenId: string;
  defenderTokenId: string;
  actionKind: CombatActionKind;
  weaponName: string;
  rangeHex: number;
  paCost: number;
  defenderAc: number;
  attack: AttackRollBreakdown;
  hit: boolean;
  critical: boolean;
  criticalFail: boolean;
  damage: DamageBreakdown | null;
  defenderHpBefore: number;
  defenderHpAfter: number;
  defenderTempHpBefore?: number;
  defenderTempHpAfter?: number;
  attackerHpBefore?: number;
  attackerHpAfter?: number;
  attackerHeal?: number;
  specialNotes?: string[];
  summary: string;
  attackIndex?: number;
  attackCount?: number;
};

const UNARMED: CombatActionOption = {
  packId: "unarmed",
  entryId: "unarmed",
  name: "Ataque desarmado",
  kind: "unarmed",
  resolution: "attack",
  damageFormula: "1d4",
  damageType: "contundente",
  attackBonus: 0,
  rangeHex: 1,
  paCost: PA_DEFAULT_ACTION_COST,
  label: `Ataque desarmado · 1 hex · PA ${PA_DEFAULT_ACTION_COST}`,
};

const MONSTER_UNARMED: CombatActionOption = {
  ...UNARMED,
  name: "Ataque natural",
  label: `Ataque natural · 1 hex · PA ${PA_DEFAULT_ACTION_COST}`,
};

function parseSaveAttribute(raw: string | undefined): AttributeKey | undefined {
  if (!raw) return undefined;
  const map: Record<string, AttributeKey> = {
    for: "forca",
    forca: "forca",
    des: "destreza",
    destreza: "destreza",
    con: "constituicao",
    constituicao: "constituicao",
    int: "inteligencia",
    inteligencia: "inteligencia",
    sab: "sabedoria",
    sabedoria: "sabedoria",
    car: "carisma",
    carisma: "carisma",
  };
  return map[raw.toLowerCase()] ?? undefined;
}

function parseHealFormulaFromDescription(description: string): string | null {
  const plain = description.replace(/<[^>]+>/g, " ");
  const m = plain.match(/Cura\s+(\d+d\d+)/i);
  return m?.[1] ?? null;
}

function actionFromEntry(
  entry: CompendiumEntry,
  packId: "armas" | "magias"
): CombatActionOption | null {
  if (packId === "magias") return buildMagiaCombatAction(entry);

  const weapon = entry.system.weapon as
    | {
        dano?: { formula?: string; tipo?: string };
        ataque?: { bonus?: number };
        special?: unknown;
      }
    | undefined;
  const tactical = entry.system.tactical as
    | { alcanceHex?: { value?: number }; custoPontosAcao?: { value?: number } }
    | undefined;

  const rangeHex = tactical?.alcanceHex?.value ?? 1;
  const rawPa = tactical?.custoPontosAcao?.value ?? PA_DEFAULT_ACTION_COST;
  const paCost = Math.max(PA_DEFAULT_ACTION_COST, rawPa);
  const damageFormula = weapon?.dano?.formula ?? "1d4";
  const damageType = weapon?.dano?.tipo ?? "contundente";

  return {
    packId,
    entryId: entry.id,
    name: entry.name,
    kind: "weapon",
    resolution: "attack",
    damageFormula,
    damageType,
    attackBonus: weapon?.ataque?.bonus ?? 0,
    rangeHex,
    paCost,
    equipmentSpecials: normalizeWeaponSpecial(weapon?.special),
    label: `${entry.name} · ${rangeHex} hex · PA ${paCost}`,
  };
}

function attackerHp(token: BattleToken): number {
  return token.vida ?? 0;
}

function applyHitSpecialsToResolution(
  res: AttackResolution,
  attackerToken: BattleToken,
  action: CombatActionOption,
  hit: boolean,
  critical: boolean,
  damage: DamageBreakdown | null,
  hpBefore: number,
  tempBefore: number
): AttackResolution {
  const specials = action.equipmentSpecials ?? [];
  if (!specials.length) return res;

  const fx = applyEquipmentOnHitEffects(specials, hit, critical);
  let hpAfter = res.defenderHpAfter;
  let tempAfter = res.defenderTempHpAfter ?? tempBefore;
  let dmg = damage;
  if (hit && dmg && fx.bonusDamage > 0) {
    dmg = mergeBonusIntoDamage(dmg, fx.bonusDamage, fx.notes);
    const damaged = applyDamageWithTempHp(hpBefore, tempBefore, dmg.total);
    hpAfter = damaged.hp;
    tempAfter = damaged.tempHp;
  }

  const atkHpBefore = attackerHp(attackerToken);
  const atkMax = attackerToken.vidaMax ?? atkHpBefore;
  const atkHpAfter =
    fx.attackerHeal > 0
      ? Math.min(atkMax, atkHpBefore + fx.attackerHeal)
      : atkHpBefore;

  let summary = res.summary;
  if (fx.attackerHeal > 0) {
    summary = appendHealToSummary(
      summary,
      fx.attackerHeal,
      fx.notes.length ? fx.notes.join(", ") : undefined
    );
  }

  return {
    ...res,
    damage: dmg,
    defenderHpAfter: hpAfter,
    defenderTempHpAfter: tempAfter,
    attackerHpBefore: atkHpBefore,
    attackerHpAfter: atkHpAfter,
    attackerHeal: fx.attackerHeal || undefined,
    specialNotes: fx.notes.length ? fx.notes : undefined,
    summary,
  };
}

export function listCombatActions(actor: CharacterSheet): CombatActionOption[] {
  const out: CombatActionOption[] = [];

  for (const item of actor.inventory) {
    if (item.quantity <= 0) continue;
    if (item.packId === "armas" || item.packId === "magias") {
      const entry = getEntry(item.packId, item.entryId);
      if (!entry) continue;
      if (item.packId === "magias" && !isSpellCombatReady(actor, item.entryId)) continue;
      const action = actionFromEntry(entry, item.packId);
      if (action) out.push(action);
    }
    if (item.packId === "habilidades") {
      const entry = getEntry("habilidades", item.entryId);
      if (!entry) continue;
      const ability = abilityFromEntry(entry);
      if (ability) out.push(ability);
    }
  }

  for (const trackAction of listSubclassCombatActions(actor)) {
    if (!out.some((a) => a.packId === trackAction.packId && a.entryId === trackAction.entryId)) {
      out.push(trackAction);
    }
  }

  if (!out.some((a) => a.kind === "weapon" || a.kind === "unarmed")) {
    out.push(UNARMED);
  }
  return out;
}

export function listTokenCombatActions(
  token: BattleToken,
  actor: CharacterSheet | null,
  filter?: "weapon" | "spell" | "ability"
): CombatActionOption[] {
  let all: CombatActionOption[];
  if (actor) {
    all = listCombatActions(actor);
  } else if (token.gmCreationId) {
    const custom = token.gmActions ?? [];
    all = custom.length ? [...custom, MONSTER_UNARMED] : [MONSTER_UNARMED];
  } else if (token.monsterEntryId) {
    const monsterActions = monsterCombatActions(token.monsterEntryId);
    all = monsterActions.length ? [...monsterActions, MONSTER_UNARMED] : [MONSTER_UNARMED];
  } else {
    all = [UNARMED];
  }
  if (!filter) return all;
  if (filter === "weapon") {
    return all.filter((a) => a.kind === "weapon" || a.kind === "unarmed");
  }
  return all.filter((a) => a.kind === filter);
}

export function resolveRoomAttackAction(
  attacker: BattleToken,
  actor: CharacterSheet | null,
  opts: CombatActionRequest
): CombatActionOption {
  if (actor) return resolveCombatAction(actor, opts);

  const actions = listTokenCombatActions(attacker, null);
  if (opts.packId && opts.entryId) {
    const byPack = actions.find(
      (a) => a.packId === opts.packId && a.entryId === opts.entryId
    );
    if (byPack) return byPack;
    throw new Error(`Ação "${opts.entryId}" não está disponível no combate`);
  }
  if (opts.entryId) {
    const byEntry = actions.find((a) => a.entryId === opts.entryId);
    if (byEntry) return byEntry;
    throw new Error(`Ação "${opts.entryId}" não está disponível no combate`);
  }
  const fallback = actions[0];
  if (!fallback) throw new Error("Atacante sem ações de combate");
  return fallback;
}

export function combatAttackRequestOpts(
  action: CombatActionOption,
  attacker: BattleToken,
  opts?: {
    bypassTurn?: boolean;
    channelExtraPa?: number;
  }
): {
  actionPack?: "armas" | "magias" | "habilidades";
  actionEntryId?: string;
  bypassTurn?: boolean;
  channelExtraPa?: number;
} {
  const packId =
    action.packId === "armas" ||
    action.packId === "magias" ||
    action.packId === "habilidades"
      ? action.packId
      : undefined;
  const needsEntryId =
    Boolean(packId) || isMonsterToken(attacker) || Boolean(attacker.gmCreationId);
  return {
    actionPack: packId,
    actionEntryId: needsEntryId ? action.entryId : undefined,
    bypassTurn: opts?.bypassTurn,
    ...(action.channelMaxExtraPa && opts?.channelExtraPa
      ? { channelExtraPa: opts.channelExtraPa }
      : {}),
  };
}

export function defaultCombatLoadout(actor: CharacterSheet): CombatLoadout | null {
  const first = listCombatActions(actor).find(
    (a) => a.packId !== "unarmed" && a.kind !== "ability"
  );
  if (!first || first.packId === "unarmed") return null;
  if (first.packId === "armas" || first.packId === "magias" || first.packId === "habilidades") {
    return { packId: first.packId, entryId: first.entryId };
  }
  return null;
}

export function resolveCombatAction(
  actor: CharacterSheet,
  request?: CombatActionRequest
): CombatActionOption {
  const actions = listCombatActions(actor);
  const loadout = actor.combatLoadout ?? defaultCombatLoadout(actor);

  const packId = request?.packId ?? loadout?.packId;
  const entryId = request?.entryId ?? loadout?.entryId;

  if (packId && entryId) {
    const found = actions.find((a) => a.packId === packId && a.entryId === entryId);
    if (found) return found;
    throw new Error(`Ação "${entryId}" não está disponível no combate`);
  }

  const fallback = actions.find((a) => a.kind === "weapon" || a.kind === "spell") ?? actions[0];
  return fallback ?? UNARMED;
}

/** @alias weaponAttackCount — Ataque Extra (Guerreiro nv5/11/17). */
export function warriorAttackCount(actor: CharacterSheet, action: CombatActionOption): number {
  return weaponAttackCount(actor, action);
}

/** @deprecated */
export function resolveWeaponForActor(actor: CharacterSheet): CombatActionOption {
  return resolveCombatAction(actor, actor.combatLoadout ?? undefined);
}

export function spellcastingAttribute(classId: string): AttributeKey {
  switch (classId) {
    case "Mago":
    case "Artifice":
      return "inteligencia";
    case "Clérigo":
    case "Druida":
      return "sabedoria";
    case "Bardo":
    case "Paladino":
    case "Bruxo":
      return "carisma";
    default:
      return "inteligencia";
  }
}

export function attackAttribute(actor: CharacterSheet, action: CombatActionOption): AttributeKey {
  if (action.kind === "spell") return spellcastingAttribute(actor.identity.classe);
  return action.rangeHex > 1 ? "destreza" : "forca";
}

function attributeLabel(key: AttributeKey): string {
  const map: Record<AttributeKey, string> = {
    forca: "FOR",
    destreza: "DES",
    constituicao: "CON",
    inteligencia: "INT",
    sabedoria: "SAB",
    carisma: "CAR",
  };
  return map[key];
}

export function isProficient(actor: CharacterSheet, action: CombatActionOption): boolean {
  if (action.kind === "unarmed") return true;
  if (action.kind === "spell") {
    const casters = ["Mago", "Clérigo", "Bardo", "Druida", "Artifice"];
    return casters.includes(actor.identity.classe);
  }
  const cls = getClass(actor.identity.classe);
  if (!cls) return false;
  const p = cls.proficiencies.toLowerCase();
  return p.includes("todas armas") || p.includes("armas simples") || p.includes("armas marciais");
}

function rollActionDamage(formula: string, attrMod: number, critical: boolean): DamageBreakdown {
  const base = rollDice(formula);
  let rolls = [...base.rolls];
  if (critical) {
    const extra = rollDice(formula);
    rolls = [...rolls, ...extra.rolls];
  }
  const total = rolls.reduce((a, b) => a + b, 0) + attrMod;
  return {
    formula,
    rolls,
    attributeMod: attrMod,
    total: Math.max(0, total),
    doubled: critical,
  };
}

export function effectiveDefenderAc(token: BattleToken): number {
  return (token.defesa ?? 10) + (token.defesaBonus ?? 0);
}

export function buildAttackModifiers(
  attacker: BattleToken,
  defender: BattleToken,
  action: CombatActionOption
): { modifier: AttackModifier; consumeAttackerMark: boolean; consumeDefenderFinta: boolean } {
  let attackBonus = attacker.nextAttackBonus ?? 0;
  const labels: string[] = [];

  if (attackBonus) labels.push(`+${attackBonus}`);
  if (attacker.allyAttackAdvantage) labels.push("inspiração");
  if (attacker.rangedAttackAdvantage && action.rangeHex > 1) labels.push("tiro certeiro");

  const mark: AttackMark | undefined = attacker.attackMark;
  let consumeAttackerMark = false;
  if (mark && mark.targetId === defender.id) {
    if (mark.attackerDisadvantage) {
      labels.push("finta");
      consumeAttackerMark = true;
    } else {
      if (mark.rangedOnly && action.rangeHex <= 1) {
        /* mark stays */
      } else {
        if (mark.bonus) attackBonus += mark.bonus;
        if (mark.advantage || mark.bonus) labels.push("marca");
        if (mark.bonus) labels.push(`marca +${mark.bonus}`);
        consumeAttackerMark = true;
      }
    }
  }

  const consumeDefenderFinta = Boolean(attacker.attackMark?.attackerDisadvantage);
  if (attacker.attackMark?.attackerDisadvantage) {
    if (!labels.includes("finta")) labels.push("finta");
    consumeAttackerMark = true;
  }

  if (attacker.bonusDamageFormula) {
    labels.push(attacker.bonusDamageFormula);
  }

  return {
    modifier: {
      attackBonus: attackBonus || undefined,
      label: labels.length ? labels.join(", ") : undefined,
    },
    consumeAttackerMark,
    consumeDefenderFinta,
  };
}

export function attackerAfterAttack(
  attacker: BattleToken,
  action: CombatActionOption,
  consumeAttackerMark: boolean,
  _consumeDefenderFinta: boolean,
  hit: boolean
): Partial<BattleToken> {
  const patch: Partial<BattleToken> = {};
  if (attacker.nextAttackBonus) patch.nextAttackBonus = undefined;
  if (attacker.allyAttackAdvantage) patch.allyAttackAdvantage = undefined;
  if (attacker.rangedAttackAdvantage && action.rangeHex > 1) {
    patch.rangedAttackAdvantage = undefined;
  }
  if (consumeAttackerMark) patch.attackMark = undefined;
  if (attacker.chargeReady && action.rangeHex <= 1) patch.chargeReady = undefined;
  if (hit && attacker.bonusDamageFormula) patch.bonusDamageFormula = undefined;

  const consumed: (keyof import("@/lib/vtt/types").BattleToken)[] = [];
  if (patch.nextAttackBonus !== undefined) consumed.push("nextAttackBonus");
  if (patch.allyAttackAdvantage !== undefined) consumed.push("allyAttackAdvantage");
  if (patch.rangedAttackAdvantage !== undefined) consumed.push("rangedAttackAdvantage");
  if (patch.chargeReady !== undefined) consumed.push("chargeReady", "chargeNote");
  if (patch.bonusDamageFormula !== undefined) consumed.push("bonusDamageFormula");
  if (patch.attackMark !== undefined) consumed.push("attackMark");

  if (consumed.length) {
    const cleared = clearTimedEffectsForFields(attacker, consumed);
    if (cleared.timedEffects !== attacker.timedEffects) {
      patch.timedEffects = cleared.timedEffects;
    }
  }

  return patch;
}

function mergeModifiers(base?: AttackModifier, extra?: AttackModifier): AttackModifier | undefined {
  if (!base && !extra) return undefined;
  const bonus = (base?.attackBonus ?? 0) + (extra?.attackBonus ?? 0);
  return {
    attackBonus: bonus || undefined,
    label: [base?.label, extra?.label].filter(Boolean).join(", ") || undefined,
    rollMode: combineRollModes(base?.rollMode ?? "normal", extra?.rollMode ?? "normal"),
  };
}

function defenderHp(token: BattleToken): number {
  return token.vida ?? 0;
}

function isMonsterSide(token: BattleToken): boolean {
  return Boolean(token.monsterEntryId || token.gmCreationId);
}

function isFriendlyTarget(attacker: BattleToken, defender: BattleToken): boolean {
  if (attacker.id === defender.id) return false;
  if (isMonsterSide(attacker)) return isMonsterSide(defender);
  return !isMonsterSide(defender);
}

export function isHealingSpell(action: CombatActionOption): boolean {
  const dt = (action.damageType ?? "").toLowerCase();
  return (
    dt.includes("cura") ||
    action.abilityEffect === "heal_touch" ||
    action.spellEffect === "heal"
  );
}

/** PA do próximo ataque — 2º golpe no turno não reaproveita desconto do 1º (ex. Corte Limpo). */
export function paNeedForCombatAction(
  attacker: BattleToken,
  actor: CharacterSheet | null,
  action: CombatActionOption,
  channelExtraPa = 0
): number {
  if (!actor) return action.paCost + channelExtraPa;
  if (action.channelMaxExtraPa != null) {
    return totalChannelPaCost(actor, action, channelExtraPa, attacker);
  }
  if (action.kind === "weapon") {
    const count = weaponAttackCount(actor, action);
    if (count > 1) return totalAttackPaCost(actor, action, attacker);
    const attackIndex = weaponAttackPaIndex(attacker, action, undefined, actor);
    return effectivePaCost(
      actor,
      action,
      mergePaCostContext(attacker, { attackIndex, attackCount: count })
    );
  }
  return effectivePaCost(actor, action, paCostContextFromToken(attacker));
}

/** Jogador (não criatura) atacando aliado com ação ofensiva — exige confirmação na UI. */
export function needsFriendlyFireConfirm(
  attacker: BattleToken,
  defender: BattleToken,
  action: CombatActionOption
): boolean {
  if (isMonsterToken(attacker)) return false;
  if (action.selfTarget || action.allyTarget) return false;
  if (action.kind === "spell" && isHealingSpell(action)) return false;
  return isFriendlyTarget(attacker, defender);
}

export function canAttackTarget(
  attacker: BattleToken,
  defender: BattleToken,
  action: CombatActionOption,
  turn?: CombatTurnOptions,
  opts?: {
    skipRangeCheck?: boolean;
    actor?: CharacterSheet | null;
    skipPaCheck?: boolean;
    channelExtraPa?: number;
  }
): { ok: boolean; reason?: string } {
  if ((action.kind === "ability" || action.kind === "spell") && action.selfTarget) {
    return { ok: false, reason: "Use o anel de ações (alvo próprio)" };
  }
  if (isAreaSpellAction(action)) {
    return { ok: false, reason: "Magia de área — clique o centro no mapa" };
  }
  if (attacker.id === defender.id) return { ok: false, reason: "Alvo inválido" };

  if (
    !canActOnCombatTurn(attacker.id, {
      activeTokenId: turn?.activeTokenId,
      bypassTurn: turn?.bypassTurn,
      combatHasOrder: turn?.combatHasOrder,
    })
  ) {
    return { ok: false, reason: TURN_WAIT_MSG };
  }

  const rechargeReason = rechargeBlockReason(attacker, action, turn?.combatRound ?? 1);
  if (rechargeReason) return { ok: false, reason: rechargeReason };

  const act = canTokenAct(attacker);
  if (!act.ok) return act;

  const dist = tokenAxialDistance(attacker, defender);
  if (!opts?.skipRangeCheck && dist > action.rangeHex) {
    return { ok: false, reason: `Fora de alcance (${dist} hex, máx ${action.rangeHex})` };
  }
  if (!opts?.skipPaCheck) {
    const channelExtra = opts?.channelExtraPa ?? 0;
    const paNeed = paNeedForCombatAction(attacker, opts?.actor ?? null, action, channelExtra);
    const paCheck = checkCanSpendPa(attacker, paNeed);
    if (!paCheck.ok) return { ok: false, reason: paCheck.reason };
  }
  if (defender.vidaMax != null && defenderHp(defender) <= 0) {
    return { ok: false, reason: "Alvo já derrotado" };
  }

  if (action.kind === "spell" && isHealingSpell(action)) {
    if (!isFriendlyTarget(attacker, defender)) {
      return { ok: false, reason: "Selecione um aliado para curar" };
    }
  }

  return { ok: true };
}

function monsterDamageAttrMod(action: CombatActionOption, attrMod: number): number {
  if (/[+-]\d+$/i.test(action.damageFormula.replace(/\s/g, ""))) return 0;
  return attrMod;
}

function resolveMonsterAttack(
  attackerToken: BattleToken,
  defenderToken: BattleToken,
  action: CombatActionOption,
  turn?: CombatTurnOptions,
  modifier?: AttackModifier,
  allTokens: BattleToken[] = []
): AttackResolution {
  const check = canAttackTarget(attackerToken, defenderToken, action, turn);
  if (!check.ok) throw new Error(check.reason ?? "Ataque inválido");

  const template = attackerToken.monsterEntryId
    ? getMonsterTemplate(attackerToken.monsterEntryId)
    : null;
  const gmStats = attackerToken.gmCreatureStats;
  const fixedMod = template
    ? action.rangeHex > 1
      ? Math.floor((template.agilidade - 10) / 2)
      : Math.floor((template.forca - 10) / 2)
    : gmStats
      ? action.rangeHex > 1
        ? Math.floor((gmStats.agilidade - 10) / 2)
        : Math.floor((gmStats.forca - 10) / 2)
      : 0;

  const built = buildAttackModifiers(attackerToken, defenderToken, action);
  const goblinMod = goblinMonsterAttackModifier(attackerToken, defenderToken, allTokens);
  const merged = mergeModifiers(
    mergeModifiers(built.modifier, goblinMod),
    modifier
  );
  const extraBonus = merged?.attackBonus ?? 0;

  const rollMode = combineRollModes(
    attackRollMode(attackerToken, defenderToken, allTokens, { action }),
    merged?.rollMode ?? "normal"
  );
  const naturalRoll = rollD20(rollMode);
  const natural = naturalRoll.natural;
  const attackTotal = natural + fixedMod + action.attackBonus + extraBonus;
  const ac = effectiveDefenderAc(defenderToken);
  const critical = natural === 20;
  const criticalFail = natural === 1;
  const hit = critical || (!criticalFail && attackTotal >= ac);

  const hpBefore = defenderHp(defenderToken);
  const tempBefore = defenderToken.vidaTemp ?? 0;
  let damage: DamageBreakdown | null = null;
  let hpAfter = hpBefore;
  let tempAfter = tempBefore;

  if (hit) {
    damage = rollActionDamage(
      action.damageFormula,
      monsterDamageAttrMod(action, fixedMod),
      critical
    );
    const sneakFormula = isGoblinMonster(attackerToken.monsterEntryId)
      ? goblinSneakAttackExtra(rollMode)
      : undefined;
    if (sneakFormula) {
      const sneak = rollDice(sneakFormula);
      damage = {
        ...damage,
        formula: `${damage.formula}+${sneakFormula}`,
        rolls: [...damage.rolls, ...sneak.rolls],
        total: damage.total + sneak.total,
      };
    }
    const dmgTotal = resistedDamageAmount(damage.total, defenderToken, action.damageType);
    const damaged = applyDamageWithTempHp(hpBefore, tempBefore, dmgTotal);
    hpAfter = damaged.hp;
    tempAfter = damaged.tempHp;
  }

  let baseRes: AttackResolution = {
    attackerTokenId: attackerToken.id,
    defenderTokenId: defenderToken.id,
    actionKind: action.kind,
    weaponName: action.name,
    rangeHex: action.rangeHex,
    paCost: action.paCost,
    defenderAc: ac,
    attack: {
      natural,
      attributeMod: fixedMod,
      profBonus: 0,
      weaponBonus: action.attackBonus,
      total: attackTotal,
      attributeLabel: action.rangeHex > 1 ? "DES" : "FOR",
      rollMode,
      d20Detail: formatD20Detail(naturalRoll),
    },
    hit,
    critical,
    criticalFail,
    damage,
    defenderHpBefore: hpBefore,
    defenderHpAfter: hpAfter,
    defenderTempHpBefore: tempBefore,
    defenderTempHpAfter: tempAfter,
    summary: "",
  };

  const name = attackerToken.name;
  const modeTag = rollMode !== "normal" ? ` [${formatRollMode(rollMode)}]` : "";
  let summary: string;
  if (criticalFail) {
    summary = `${name} falha ao atacar! (natural 1)`;
  } else if (!hit) {
    summary = `${name} ataca${modeTag} ${defenderToken.name}: ${attackTotal} vs CA ${ac} — ERROU`;
  } else if (critical) {
    summary = `${name} CRÍTICO${modeTag} em ${defenderToken.name}! ${damage!.total} ${action.damageType}`;
  } else {
    summary = `${name} acerta${modeTag} ${defenderToken.name}: ${attackTotal} vs CA ${ac} — ${damage!.total} ${action.damageType}`;
  }

  baseRes.summary = summary;
  return applyHitSpecialsToResolution(
    baseRes,
    attackerToken,
    action,
    hit,
    critical,
    damage,
    hpBefore,
    tempBefore
  );
}

export function resolveAttack(
  attackerToken: BattleToken,
  defenderToken: BattleToken,
  actor: CharacterSheet,
  action: CombatActionOption = resolveCombatAction(actor),
  turn?: CombatTurnOptions,
  modifier?: AttackModifier,
  allTokens: BattleToken[] = [],
  opts?: {
    skipRangeCheck?: boolean;
    skipPaCheck?: boolean;
    attackIndex?: number;
    attackCount?: number;
    channelExtraPa?: number;
  }
): AttackResolution {
  const channelExtra = clampChannelExtraPa(action, opts?.channelExtraPa ?? 0);
  const resolved = actionWithChannel(action, channelExtra);

  const check = canAttackTarget(attackerToken, defenderToken, action, turn, {
    ...opts,
    actor,
    channelExtraPa: channelExtra,
  });
  if (!check.ok) throw new Error(check.reason ?? "Ataque inválido");

  if (isHealingSpell(resolved)) {
    const castKey = spellcastingAttribute(actor.identity.classe);
    const castMod = attributeMod(actor.attributes[castKey]);
    const healRoll = rollActionDamage(resolved.damageFormula, castMod, false);
    const hpBefore = defenderHp(defenderToken);
    const hpMax = defenderToken.vidaMax ?? hpBefore;
    const hpAfter = Math.min(hpMax, hpBefore + healRoll.total);
    const attr = attributeLabel(castKey);
    const paCost = effectivePaCost(
      actor,
      action,
      mergePaCostContext(attackerToken, {
        attackIndex: weaponAttackPaIndex(attackerToken, action, opts?.attackIndex, actor),
        attackCount: opts?.attackCount ?? 1,
      })
    );
    const summary = `${actor.name} cura ${defenderToken.name} com ${resolved.name}: +${healRoll.total} HP (${healRoll.rolls.join("+")}${healRoll.attributeMod ? `+${healRoll.attributeMod}` : ""} ${attr}) — ${hpBefore}→${hpAfter}`;

    return {
      attackerTokenId: attackerToken.id,
      defenderTokenId: defenderToken.id,
      actionKind: "spell",
      weaponName: resolved.name,
      rangeHex: resolved.rangeHex,
      paCost,
      defenderAc: effectiveDefenderAc(defenderToken),
      attack: {
        natural: 20,
        attributeMod: castMod,
        profBonus: 0,
        weaponBonus: 0,
        total: 0,
        attributeLabel: attr,
        rollMode: "normal",
        d20Detail: "toque",
      },
      hit: true,
      critical: false,
      criticalFail: false,
      damage: healRoll,
      defenderHpBefore: hpBefore,
      defenderHpAfter: hpAfter,
      summary,
    };
  }

  const attrKey = attackAttribute(actor, resolved);
  const attrMod = attributeMod(actor.attributes[attrKey]);
  const prof = isProficient(actor, action) ? proficiencyBonus(actor.identity.nivel) : 0;
  const built = buildAttackModifiers(attackerToken, defenderToken, resolved);
  const merged = mergeModifiers(built.modifier, modifier);
  const extraBonus = merged?.attackBonus ?? 0;
  const rollMode = combineRollModes(
    attackRollMode(attackerToken, defenderToken, allTokens, { action: resolved }),
    merged?.rollMode ?? "normal"
  );
  const naturalRoll = rollD20(rollMode);
  const natural = naturalRoll.natural;
  const attackTotal = natural + attrMod + prof + resolved.attackBonus + extraBonus;

  const ac = effectiveDefenderAc(defenderToken);
  const critical = natural === 20;
  const criticalFail = natural === 1;
  const hit = critical || (!criticalFail && attackTotal >= ac);

  const hpBefore = defenderHp(defenderToken);
  const tempBefore = defenderToken.vidaTemp ?? 0;
  let damage: DamageBreakdown | null = null;
  let hpAfter = hpBefore;
  let tempAfter = tempBefore;

  if (hit) {
    const dmgMod = resolved.kind === "spell" ? 0 : attrMod;
    damage = rollActionDamage(resolved.damageFormula, dmgMod, critical);
    if (attackerToken.bonusDamageFormula) {
      const extra = rollDice(attackerToken.bonusDamageFormula);
      damage.rolls.push(...extra.rolls);
      damage.total += extra.total;
    }
    const dmgTotal = resistedDamageAmount(damage.total, defenderToken, resolved.damageType);
    const damaged = applyDamageWithTempHp(hpBefore, tempBefore, dmgTotal);
    hpAfter = damaged.hp;
    tempAfter = damaged.tempHp;
  }

  const attr = attributeLabel(attrKey);
  const verb = resolved.kind === "spell" ? "conjura" : "ataca";
  const modLabel = merged?.label ? ` (${merged.label})` : "";
  const channelTag = channelExtra > 0 ? ` [canalizado +${channelExtra} PA]` : "";

  let summary: string;
  if (criticalFail) {
    summary = `${actor.name} falha ao ${verb} com ${resolved.name}! (natural 1)`;
  } else if (!hit) {
    summary = `${actor.name} ${verb}${modLabel} ${defenderToken.name} com ${resolved.name}${channelTag}: ${attackTotal} vs CA ${ac} — ERROU`;
  } else if (critical) {
    summary = `${actor.name} CRÍTICO${modLabel} em ${defenderToken.name}! ${damage!.total} ${resolved.damageType} (${damage!.rolls.join("+")}${damage!.attributeMod ? `+${damage!.attributeMod}` : ""})`;
  } else {
    summary = `${actor.name} acerta${modLabel} ${defenderToken.name}: ${attackTotal} vs CA ${ac} — ${damage!.total} ${resolved.damageType}`;
  }

  const paCost = resolved.channelMaxExtraPa
    ? totalChannelPaCost(actor, action, channelExtra, attackerToken)
    : effectivePaCost(
        actor,
        action,
        mergePaCostContext(attackerToken, {
          attackIndex: weaponAttackPaIndex(attackerToken, action, opts?.attackIndex, actor),
          attackCount: opts?.attackCount ?? 1,
        })
      );

  const baseRes: AttackResolution = {
    attackerTokenId: attackerToken.id,
    defenderTokenId: defenderToken.id,
    actionKind: resolved.kind,
    weaponName: resolved.name,
    rangeHex: resolved.rangeHex,
    paCost,
    defenderAc: ac,
    attack: {
      natural,
      attributeMod: attrMod,
      profBonus: prof,
      weaponBonus: resolved.attackBonus + extraBonus,
      total: attackTotal,
      attributeLabel: attr,
      rollMode,
      d20Detail: formatD20Detail(naturalRoll),
    },
    hit,
    critical,
    criticalFail,
    damage,
    defenderHpBefore: hpBefore,
    defenderHpAfter: hpAfter,
    defenderTempHpBefore: tempBefore,
    defenderTempHpAfter: tempAfter,
    summary,
  };

  return applyHitSpecialsToResolution(
    baseRes,
    attackerToken,
    action,
    hit,
    critical,
    damage,
    hpBefore,
    tempBefore
  );
}

export function resolveMultiAttack(
  attackerTokenIn: BattleToken,
  defenderToken: BattleToken,
  actor: CharacterSheet,
  action: CombatActionOption,
  turn?: CombatTurnOptions,
  allTokens: BattleToken[] = []
): AttackResolution[] {
  const count = warriorAttackCount(actor, action);
  const totalPa = totalAttackPaCost(actor, action, attackerTokenIn);
  const paCheck = checkCanSpendPa(attackerTokenIn, totalPa);
  if (!paCheck.ok) throw new Error(paCheck.reason ?? "PA insuficiente");
  const results: AttackResolution[] = [];
  let currentDefender = { ...defenderToken };
  let attackerToken = { ...attackerTokenIn };

  for (let i = 0; i < count; i++) {
    const res = resolveAttack(attackerToken, currentDefender, actor, action, turn, undefined, allTokens, {
      skipPaCheck: true,
      attackIndex: i + 1,
      attackCount: count,
    });
    res.attackIndex = i + 1;
    res.attackCount = count;
    if (count > 1) {
      res.summary = `[${i + 1}/${count}] ${res.summary}`;
    }
    results.push(res);
    currentDefender = { ...currentDefender, vida: res.defenderHpAfter };
    if (res.attackerHpAfter != null) {
      attackerToken = { ...attackerToken, vida: res.attackerHpAfter };
    }
    const built = buildAttackModifiers(attackerToken, currentDefender, action);
    const buffCleanup = attackerAfterAttack(
      attackerToken,
      action,
      built.consumeAttackerMark,
      built.consumeDefenderFinta,
      res.hit
    );
    attackerToken = { ...attackerToken, ...buffCleanup };
    if ((currentDefender.vida ?? 0) <= 0) break;
  }

  return results;
}

export function resolveTokenAttack(
  attackerToken: BattleToken,
  defenderToken: BattleToken,
  action: CombatActionOption,
  actor: CharacterSheet | null,
  turn?: CombatTurnOptions,
  modifier?: AttackModifier,
  allTokens: BattleToken[] = [],
  opts?: { channelExtraPa?: number; skipPaCheck?: boolean }
): AttackResolution | AttackResolution[] {
  if (!actor) {
    return resolveMonsterAttack(
      attackerToken,
      defenderToken,
      action,
      turn,
      modifier,
      allTokens
    );
  }
  if (action.kind === "weapon" && warriorAttackCount(actor, action) > 1) {
    return resolveMultiAttack(attackerToken, defenderToken, actor, action, turn, allTokens);
  }
  return resolveAttack(attackerToken, defenderToken, actor, action, turn, modifier, allTokens, {
    channelExtraPa: opts?.channelExtraPa,
    skipPaCheck: opts?.skipPaCheck,
  });
}

export function formatAttackChatDetail(res: AttackResolution): string {
  const a = res.attack;
  const kind =
    res.actionKind === "spell" ? "Magia" : res.actionKind === "ability" ? "Habilidade" : "Ataque";
  const rollPart = a.d20Detail ?? `1d20=${a.natural}`;
  const parts = [
    `${kind} ${rollPart} +${a.attributeMod}+${a.profBonus}${a.weaponBonus ? `+${a.weaponBonus}` : ""} = ${a.total}`,
    `CA ${res.defenderAc}`,
  ];
  if (res.hit && res.damage) {
    const heal = res.summary.includes(" cura ");
    const dmgLabel = heal ? "Cura" : "Dano";
    parts.push(
      `${dmgLabel} ${res.damage.rolls.join("+")}${res.damage.attributeMod ? `+${res.damage.attributeMod}` : ""} = ${res.damage.total}`
    );
    parts.push(`HP ${res.defenderHpBefore}→${res.defenderHpAfter}`);
  }
  if (res.attackerHeal && res.attackerHpBefore != null && res.attackerHpAfter != null) {
    parts.push(`Atacante HP ${res.attackerHpBefore}→${res.attackerHpAfter}`);
  }
  if (res.specialNotes?.length) {
    parts.push(res.specialNotes.join(", "));
  }
  return parts.join(" · ");
}

export function getAttackableTargets(
  attacker: BattleToken,
  defender: BattleToken,
  actor: CharacterSheet | null,
  turn?: CombatTurnOptions
): { ok: boolean; reason?: string; action: CombatActionOption | null } {
  if (!actor) return { ok: false, reason: "Sem ficha", action: null };
  const action = resolveCombatAction(actor);
  const check = canAttackTarget(attacker, defender, action, turn);
  return { ...check, action };
}
