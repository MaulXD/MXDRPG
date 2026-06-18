import { attributeMod, proficiencyBonus } from "@/lib/character/rules";
import type { CharacterSheet } from "@/lib/character/types";
import { hasFlanking } from "@/lib/combat/ability";
import {
  attackAttribute,
  buildAttackModifiers,
  effectiveDefenderAc,
  isProficient,
} from "@/lib/combat/attack";
import {
  attackRollModeDetail,
  formatRollModeWithSources,
  saveRollModeDetail,
} from "@/lib/combat/conditions";
import { isPoisonDamageType } from "@/lib/combat/damage-resist";
import { combineRollModes, type RollMode } from "@/lib/combat/d20";
import type { CombatActionOption } from "@/lib/combat/types";
import { goblinMonsterAttackModifier } from "@/lib/vtt/goblin-combat";
import { getMonsterTemplate } from "@/lib/vtt/monsters";
import type { BattleToken } from "@/lib/vtt/types";
import { computeSpellSaveDc } from "@/lib/combat/spell";

export type TargetCombatPreview = {
  kind: "attack" | "save";
  rollMode: RollMode;
  /** Vantagem / Desvantagem / vazio */
  rollModeText: string;
  ac: number;
  attackBonus?: number;
  dc?: number;
  /** Chance de acertar (ataque) 0–100 */
  hitChancePercent: number | null;
  /** Chance do alvo falhar no teste (magia) 0–100 */
  saveFailPercent: number | null;
  /** Rótulo curto para HUD / canvas */
  summaryLabel: string;
};

function doesNaturalHit(natural: number, bonus: number, ac: number): boolean {
  if (natural === 1) return false;
  if (natural === 20) return true;
  return natural + bonus >= ac;
}

function hitChanceSingle(bonus: number, ac: number): number {
  let hits = 0;
  for (let n = 1; n <= 20; n++) {
    if (doesNaturalHit(n, bonus, ac)) hits++;
  }
  return hits / 20;
}

function rollModeChance(
  bonus: number,
  threshold: number,
  mode: RollMode,
  succeeds: (natural: number, bonus: number, threshold: number) => boolean
): number {
  if (mode === "normal") {
    let c = 0;
    for (let n = 1; n <= 20; n++) {
      if (succeeds(n, bonus, threshold)) c++;
    }
    return c / 20;
  }
  let p = 0;
  for (let i = 1; i <= 20; i++) {
    for (let j = 1; j <= 20; j++) {
      const nat = mode === "advantage" ? Math.max(i, j) : Math.min(i, j);
      if (succeeds(nat, bonus, threshold)) p += 1 / 400;
    }
  }
  return p;
}

function hitChancePercent(bonus: number, ac: number, mode: RollMode): number {
  return Math.round(
    rollModeChance(bonus, ac, mode, (nat, b, th) => doesNaturalHit(nat, b, th)) * 100
  );
}

function saveFails(natural: number, saveBonus: number, dc: number): boolean {
  return natural + saveBonus < dc;
}

function formatSaveRollModeText(detail: ReturnType<typeof saveRollModeDetail>): string {
  const base = formatRollModeWithSources(detail.mode, detail.sources);
  if (!base) return "";
  return `${base} no teste de resistência`;
}

function saveFailPercent(saveBonus: number, dc: number, mode: RollMode): number {
  return Math.round(
    rollModeChance(saveBonus, dc, mode, (nat, b, th) => saveFails(nat, b, th)) * 100
  );
}

function monsterAttackBonus(
  attacker: BattleToken,
  action: CombatActionOption
): number {
  const template = attacker.monsterEntryId
    ? getMonsterTemplate(attacker.monsterEntryId)
    : null;
  const gm = attacker.gmCreatureStats;
  if (template) {
    const mod =
      action.rangeCells > 1
        ? Math.floor((template.agilidade - 10) / 2)
        : Math.floor((template.forca - 10) / 2);
    return mod + action.attackBonus;
  }
  if (gm) {
    const mod =
      action.rangeCells > 1
        ? Math.floor((gm.agilidade - 10) / 2)
        : Math.floor((gm.forca - 10) / 2);
    return mod + action.attackBonus;
  }
  return action.attackBonus;
}

export function estimateTargetCombatPreview(
  attacker: BattleToken,
  defender: BattleToken,
  actor: CharacterSheet | null,
  defenderActor: CharacterSheet | null,
  action: CombatActionOption,
  allTokens: BattleToken[]
): TargetCombatPreview | null {
  if (action.selfTarget || action.allyTarget) return null;

  const ac = effectiveDefenderAc(defender);

  if (action.resolution === "save" && actor) {
    const dc = computeSpellSaveDc(actor, action);
    const saveKey = action.saveAttribute ?? "constituicao";
    const saveAttr = defenderActor?.attributes[saveKey] ?? 10;
    const saveBonus =
      attributeMod(saveAttr) +
      (defenderActor ? proficiencyBonus(defenderActor.identity.nivel) : 0);
    const saveDetail = saveRollModeDetail(defender, {
      poison: isPoisonDamageType(action.damageType),
    });
    const failPct = saveFailPercent(saveBonus, dc, saveDetail.mode);
    const rollModeText = formatSaveRollModeText(saveDetail);
    const modeSuffix = rollModeText ? ` · ${rollModeText}` : "";
    return {
      kind: "save",
      rollMode: saveDetail.mode,
      rollModeText,
      ac,
      dc,
      hitChancePercent: null,
      saveFailPercent: failPct,
      summaryLabel: `${failPct}% falha no teste (CD ${dc})${modeSuffix}`,
    };
  }

  if (action.kind === "ability" && action.abilityEffect === "restrain" && actor) {
    const dc = computeSpellSaveDc(actor, action);
    const saveKey = action.saveAttribute ?? "constituicao";
    const saveAttr = defenderActor?.attributes[saveKey] ?? 10;
    const saveBonus =
      attributeMod(saveAttr) +
      (defenderActor ? proficiencyBonus(defenderActor.identity.nivel) : 0);
    const saveDetail = saveRollModeDetail(defender);
    const failPct = saveFailPercent(saveBonus, dc, saveDetail.mode);
    const rollModeText = formatSaveRollModeText(saveDetail);
    const modeSuffix = rollModeText ? ` · ${rollModeText}` : "";
    return {
      kind: "save",
      rollMode: saveDetail.mode,
      rollModeText,
      ac,
      dc,
      hitChancePercent: null,
      saveFailPercent: failPct,
      summaryLabel: `${failPct}% falha no teste (CD ${dc})${modeSuffix}`,
    };
  }

  if (action.resolution !== "attack" && action.kind === "ability") {
    if (
      action.abilityEffect !== "spell_strike" &&
      action.abilityEffect !== "melee_attack_bonus"
    ) {
      return null;
    }
  }

  let attackBonus: number;
  let rollDetail: ReturnType<typeof attackRollModeDetail>;

  if (actor) {
    const attrKey = attackAttribute(actor, action);
    const attrMod = attributeMod(actor.attributes[attrKey]);
    const prof = isProficient(actor, action) ? proficiencyBonus(actor.identity.nivel) : 0;
    const built = buildAttackModifiers(attacker, defender, action);
    const goblinMod = goblinMonsterAttackModifier(attacker, defender, allTokens);
    const extra = (built.modifier.attackBonus ?? 0) + (goblinMod?.attackBonus ?? 0);
    attackBonus = attrMod + prof + action.attackBonus + extra;
    rollDetail = attackRollModeDetail(attacker, defender, allTokens, {
      flanking: hasFlanking(attacker, defender, allTokens),
      action,
    });
    if (goblinMod?.rollMode) {
      rollDetail = {
        mode: combineRollModes(rollDetail.mode, goblinMod.rollMode),
        sources: rollDetail.sources,
      };
    }
  } else {
    const built = buildAttackModifiers(attacker, defender, action);
    const goblinMod = goblinMonsterAttackModifier(attacker, defender, allTokens);
    const extra = (built.modifier.attackBonus ?? 0) + (goblinMod?.attackBonus ?? 0);
    attackBonus = monsterAttackBonus(attacker, action) + extra;
    rollDetail = attackRollModeDetail(attacker, defender, allTokens, { action });
    if (goblinMod?.rollMode) {
      rollDetail = {
        mode: combineRollModes(rollDetail.mode, goblinMod.rollMode),
        sources: rollDetail.sources,
      };
    }
  }

  const rollMode = rollDetail.mode;
  const hitPct = hitChancePercent(attackBonus, ac, rollMode);
  const rollModeText = formatRollModeWithSources(rollMode, rollDetail.sources);
  const modeSuffix = rollModeText ? ` · ${rollModeText}` : "";

  return {
    kind: "attack",
    rollMode,
    rollModeText,
    ac,
    attackBonus,
    hitChancePercent: hitPct,
    saveFailPercent: null,
    summaryLabel: `${hitPct}% acerto (+${attackBonus} vs CA ${ac})${modeSuffix}`,
  };
}
