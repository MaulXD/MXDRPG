import { ATTRIBUTE_LABELS } from "@/lib/character/rules";
import type { CharacterSheet } from "@/lib/character/types";
import { stripHtml } from "@/lib/compendium/format";
import { getEntry } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";
import type { SpellAreaShape } from "@/lib/combat/area-spell";
import { abilityEffectDurationHint } from "@/lib/combat/buff-durations";
import {
  effectivePaCost,
  paCostContextFromToken,
  totalAttackPaCost,
} from "@/lib/combat/pa-economy";
import type { AbilityEffect, CombatActionOption } from "@/lib/combat/types";
import { rangedLongRangeLabel } from "@/lib/combat/ranged-attack-range";
import type { BattleToken } from "@/lib/vtt/types";

const AREA_LABELS: Record<SpellAreaShape, string> = {
  single: "alvo único",
  burst: "explosão",
  cone: "cone",
  line: "raio",
  cube: "cubo",
  wall: "muralha",
};

function withDuration(effect: AbilityEffect, text: string): string {
  const duration = abilityEffectDurationHint(effect);
  return duration ? `${text} Duração: ${duration}.` : text;
}

const ABILITY_EFFECT_HINT: Record<AbilityEffect, string> = {
  melee_attack_bonus: withDuration("melee_attack_bonus", "Bônus no próximo ataque corpo a corpo."),
  defense_buff: withDuration("defense_buff", "Aumenta defesa até o início do próximo turno."),
  charge: withDuration("charge", "Investida em linha reta com bônus no ataque corpo a corpo."),
  shadow_step: withDuration("shadow_step", "Deslocamento curto (teleporte) para célula visível."),
  mark: withDuration("mark", "Marca o alvo — bônus ou vantagem no próximo ataque contra ele."),
  mark_disadvantage: withDuration(
    "mark_disadvantage",
    "Finta: desvantagem no próximo ataque do alvo."
  ),
  spell_strike: "Projétil ou raio — rolagem de ataque contra CA.",
  heal_touch: "Cura um aliado adjacente.",
  restrain: "Alvo faz teste de resistência ou fica impedido.",
  reaction_shift: withDuration("reaction_shift", "Desloca 1 célula como reação (fora do turno)."),
  wild_shape: withDuration("wild_shape", "Assume forma selvagem no próximo movimento."),
  ally_inspire: withDuration("ally_inspire", "Concede bônus temporários a um aliado."),
  ranged_advantage: withDuration("ranged_advantage", "Próximo ataque à distância com vantagem."),
};

function compendiumPack(
  packId: CombatActionOption["packId"]
): CompendiumPackId | null {
  if (packId === "armas" || packId === "magias" || packId === "habilidades") {
    return packId;
  }
  return null;
}

function effectiveCostLine(
  action: CombatActionOption,
  actor?: CharacterSheet | null,
  token?: BattleToken | null
): string {
  const chiSuffix = action.chiCost ? ` + ${action.chiCost} Chi` : "";
  if (!actor) return `Custo: ${action.paCost} PA${chiSuffix}`;
  const base = action.paCost;
  const ctx = paCostContextFromToken(token);
  const eff =
    action.kind === "weapon"
      ? totalAttackPaCost(actor, action, token)
      : effectivePaCost(actor, action, ctx);
  if (eff === base) return `Custo: ${eff} PA${chiSuffix}`;
  return `Custo: ${base} → ${eff} PA${chiSuffix} (talentos/classe)`;
}

function damageOrHealLine(action: CombatActionOption): string | null {
  const isHeal =
    action.damageType === "cura" ||
    action.abilityEffect === "heal_touch" ||
    action.name.toLowerCase().includes("cura");

  if (isHeal) {
    let formula = action.damageFormula;
    if (action.damageAttribute) {
      formula += ` + ${ATTRIBUTE_LABELS[action.damageAttribute]}`;
    }
    if (formula === "0") return "Efeito de cura (valor na descrição)";
    return `Cura: ${formula} HP`;
  }

  if (!action.damageFormula || action.damageFormula === "0") return null;

  let formula = action.damageFormula;
  if (action.bonusDamageFormula) formula += ` + ${action.bonusDamageFormula}`;
  if (action.damageAttribute) {
    formula += ` + mod. ${ATTRIBUTE_LABELS[action.damageAttribute]}`;
  }
  const tipo = action.damageType?.trim();
  return tipo ? `Dano: ${formula} (${tipo})` : `Dano: ${formula}`;
}

function resolutionLine(action: CombatActionOption): string | null {
  if (action.resolution === "save" && action.saveAttribute) {
    const attr = ATTRIBUTE_LABELS[action.saveAttribute];
    const dc = action.saveDc != null ? ` CD ${action.saveDc}` : "";
    return `Resistência ${attr}${dc} — metade do dano se passar`;
  }
  if (
    action.kind === "spell" ||
    action.abilityEffect === "spell_strike" ||
    (action.kind === "weapon" && action.resolution === "attack")
  ) {
    const bonus =
      action.attackBonus > 0
        ? ` +${action.attackBonus}`
        : action.attackBonus < 0
          ? ` ${action.attackBonus}`
          : "";
    return `Ataque vs CA do alvo (1d20${bonus} + modificador)`;
  }
  return null;
}

function areaLine(action: CombatActionOption): string | null {
  if (!action.areaShape || action.areaShape === "single") return null;
  const shape = AREA_LABELS[action.areaShape] ?? action.areaShape;
  const parts = [shape];
  if (action.areaRadiusCells != null) parts.push(`${action.areaRadiusCells} células`);
  if (action.areaCellCount != null) parts.push(`${action.areaCellCount} células`);
  return `Área: ${parts.join(" · ")}`;
}

function targetLine(action: CombatActionOption): string {
  if (action.selfTarget) return "Alvo: você";
  if (action.allyTarget) return `Alvo: aliado · alcance ${action.rangeCells} células`;
  const ranged = rangedLongRangeLabel(action);
  if (ranged) {
    return `Alcance: ${ranged} (desvantagem além do normal)`;
  }
  return `Alcance: ${action.rangeCells} células`;
}

/** Linhas de detalhe para UI e tooltip. */
export function formatCombatActionTooltipLines(
  action: CombatActionOption,
  actor?: CharacterSheet | null,
  token?: BattleToken | null
): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  const push = (line: string | null | undefined) => {
    const t = line?.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    lines.push(t);
  };

  const pack = compendiumPack(action.packId);
  if (pack) {
    const entry = getEntry(pack, action.entryId);
    if (entry) {
      const desc = stripHtml(String(entry.system.description ?? ""));
      if (desc) push(desc);

      const spell = entry.system.spell as
        | { nivel?: number; escola?: string }
        | undefined;
      if (spell?.nivel != null) {
        const nv = spell.nivel === 0 ? "Truque" : `Nível ${spell.nivel}`;
        push(spell.escola ? `${nv} · ${spell.escola}` : nv);
      }
    }
  }

  if (action.abilityEffect) {
    push(ABILITY_EFFECT_HINT[action.abilityEffect]);
  }

  push(damageOrHealLine(action));
  push(resolutionLine(action));
  push(areaLine(action));
  push(targetLine(action));
  push(effectiveCostLine(action, actor, token));

  if (action.channelMaxExtraPa) {
    push(
      `Canalizável: +0 a +${action.channelMaxExtraPa} PA extras (+${action.channelBonusPerPa ?? "1d6"} dano/PA)`
    );
  }

  if (action.defesaBuffAmount) {
    push(`Bônus: +${action.defesaBuffAmount} defesa neste turno`);
  }

  if (action.recharge?.label) {
    push(`Recarga: ${action.recharge.label}`);
  }

  if (lines.length === 0) {
    push(action.label || action.name);
  }

  return lines;
}

/** Texto único para atributo title (quebras de linha). */
export function formatCombatActionTooltip(
  action: CombatActionOption,
  actor?: CharacterSheet | null,
  token?: BattleToken | null
): string {
  return formatCombatActionTooltipLines(action, actor, token).join("\n");
}
