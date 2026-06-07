import { hasFlanking } from "@/lib/combat/ability";
import {
  buildAttackModifiers,
  canAttackTarget,
  effectiveDefenderAc,
} from "@/lib/combat/attack";
import { attackRollModeDetail, canTokenAct, formatRollModeWithSources } from "@/lib/combat/conditions";
import { formatRollMode, type RollMode } from "@/lib/combat/d20";
import { effectivePaCost, totalAttackPaCost } from "@/lib/combat/pa-economy";
import { totalChannelPaCost } from "@/lib/combat/spell-channel";
import { unifiedPaChipForAction, unifiedPaChipForMove } from "@/lib/combat/pa-chip";
import { checkCanSpendPa, tokenSpendablePa } from "@/lib/combat/pa-turn";
import type { CombatActionOption, CombatTurnOptions } from "@/lib/combat/types";
import { canAbilityTarget, canUseAbility } from "@/lib/combat/ability";
import { canCastAreaAt } from "@/lib/combat/area-spell";
import { estimateTargetCombatPreview } from "@/lib/combat/hit-chance";
import type { CharacterSheet } from "@/lib/character/types";
import type { Axial } from "@/lib/vtt/hex-math";
import { canMoveToken, type MovementPathContext } from "@/lib/vtt/movement";
import type { BattleToken } from "@/lib/vtt/types";

export type ActionPreviewLine = {
  text: string;
  tone?: "ok" | "warn" | "err";
};

export type ActionPreview = {
  title: string;
  /** Chip US-9.5: PA: 2 → 1 (Afinidade) · Restam 4/6 */
  paChip: string;
  lines: ActionPreviewLine[];
  ok: boolean;
};

function withPaChip(
  title: string,
  paChip: string,
  lines: ActionPreviewLine[],
  ok: boolean
): ActionPreview {
  return { title, paChip, lines, ok };
}

function rollModeLabel(mode: RollMode): string {
  if (mode === "normal") return "Normal";
  return formatRollMode(mode);
}

export function previewMove(
  token: BattleToken,
  target: Axial,
  mode: "walk" | "run",
  paOpts?: import("@/lib/vtt/movement").MovePaOptions,
  ctx?: MovementPathContext
): ActionPreview {
  const check = canMoveToken(token, target, mode, ctx, paOpts);
  const paChip = unifiedPaChipForMove(token, check, paOpts);
  const tier =
    check.paCost === 0
      ? "faixa sem PA extra"
      : mode === "run"
        ? "corrida (+PA)"
        : "caminhada com PA";

  return withPaChip(
    mode === "walk" ? "Caminhada" : "Corrida",
    paChip,
    [
      {
        text: check.ok
          ? `${check.dist} hex · ${tier}`
          : (check.reason ?? "Hex inválido"),
        tone: check.ok ? "ok" : "err",
      },
      ...(check.ok && check.path && check.path.length > 1
        ? [{ text: `Rota: ${check.path.length - 1} passos`, tone: "ok" as const }]
        : []),
    ],
    check.ok
  );
}

export function previewAttackOnTarget(
  attacker: BattleToken,
  defender: BattleToken,
  actor: CharacterSheet | null,
  action: CombatActionOption,
  allTokens: BattleToken[],
  turn?: CombatTurnOptions,
  channelExtraPa = 0,
  defenderActor: CharacterSheet | null = null
): ActionPreview {
  const combatPreview = estimateTargetCombatPreview(
    attacker,
    defender,
    actor,
    defenderActor,
    action,
    allTokens
  );

  if (action.kind === "ability") {
    const use = canUseAbility(attacker, action, turn, actor);
    const pa = effectivePaCost(actor, action);
    const paChip = unifiedPaChipForAction(attacker, actor, action, channelExtraPa);
    if (!use.ok) {
      return withPaChip(action.name, paChip, [{ text: use.reason ?? "Inválido", tone: "err" }], false);
    }
    const target = canAbilityTarget(attacker, defender, action, turn, actor);
    const paCheck = checkCanSpendPa(attacker, pa);
    const lines: ActionPreviewLine[] = [];
    if (combatPreview) {
      lines.push({
        text: combatPreview.summaryLabel,
        tone:
          combatPreview.rollMode === "disadvantage"
            ? "warn"
            : combatPreview.rollMode === "advantage"
              ? "ok"
              : undefined,
      });
    }
    lines.push({
      text: target.ok ? (target.reason ?? "Alvo válido") : (target.reason ?? "Alvo inválido"),
      tone: target.ok && paCheck.ok ? "ok" : "err",
    });
    return withPaChip(action.name, paChip, lines, Boolean(target.ok && paCheck.ok));
  }

  const check = canAttackTarget(attacker, defender, action, turn, { actor, channelExtraPa });
  const pa =
    actor && action.channelMaxExtraPa
      ? totalChannelPaCost(actor, action, channelExtraPa)
      : actor && action.kind === "weapon"
        ? totalAttackPaCost(actor, action)
        : effectivePaCost(actor, action);
  const paCheck = checkCanSpendPa(attacker, pa);

  const paChip = unifiedPaChipForAction(attacker, actor, action, channelExtraPa);

  const act = canTokenAct(attacker);
  if (!act.ok) {
    return withPaChip(action.name, paChip, [{ text: act.reason ?? "Não pode agir", tone: "err" }], false);
  }

  const built = buildAttackModifiers(attacker, defender, action);

  const lines: ActionPreviewLine[] = [];
  if (combatPreview) {
    lines.push({
      text: combatPreview.summaryLabel,
      tone:
        combatPreview.rollMode === "disadvantage"
          ? "warn"
          : combatPreview.rollMode === "advantage"
            ? "ok"
            : undefined,
    });
  } else {
    const rollDetail = attackRollModeDetail(attacker, defender, allTokens, {
      flanking: hasFlanking(attacker, defender, allTokens),
      action,
    });
    const rollTag =
      formatRollModeWithSources(rollDetail.mode, rollDetail.sources) ||
      rollModeLabel(rollDetail.mode);
    lines.push({
      text: `${rollTag} · CA ${effectiveDefenderAc(defender)}`,
      tone:
        rollDetail.mode === "disadvantage"
          ? "warn"
          : rollDetail.mode === "advantage"
            ? "ok"
            : undefined,
    });
  }
  if (built.modifier.label) {
    lines.push({ text: built.modifier.label, tone: "ok" });
  }
  if (!check.ok) {
    lines.push({ text: check.reason ?? "Ataque inválido", tone: "err" });
  } else if (!paCheck.ok) {
    lines.push({ text: paCheck.reason ?? "PA insuficiente", tone: "err" });
  }

  return withPaChip(action.name, paChip, lines, Boolean(check.ok && paCheck.ok));
}

export function previewAreaCast(
  caster: BattleToken,
  center: Axial,
  actor: CharacterSheet | null,
  action: CombatActionOption,
  turn?: CombatTurnOptions,
  areaDirection?: number | null,
  channelExtraPa = 0
): ActionPreview {
  const check = canCastAreaAt(caster, center, action, turn, actor, channelExtraPa);
  const pa = actor
    ? action.channelMaxExtraPa
      ? totalChannelPaCost(actor, action, channelExtraPa)
      : effectivePaCost(actor, action)
    : action.paCost + channelExtraPa;
  const paCheck = checkCanSpendPa(caster, pa);
  const paChip = unifiedPaChipForAction(caster, actor, action, channelExtraPa);

  return withPaChip(
    action.name,
    paChip,
    [
      {
        text:
          action.areaShape && (action.areaShape === "cone" || action.areaShape === "line")
            ? `Origem: conjurador q${caster.axial.q} r${caster.axial.r}`
            : `Centro q${center.q} r${center.r}`,
        tone: "ok",
      },
      {
        text: check.ok ? "Solte para conjurar" : (check.reason ?? "Inválido"),
        tone: check.ok && paCheck.ok ? "ok" : "err",
      },
    ],
    Boolean(check.ok && paCheck.ok)
  );
}

export function previewAreaDirectionStep(
  shape: "cone" | "line",
  token?: BattleToken
): ActionPreview {
  const paChip = token
    ? `PA: — · Restam ${tokenSpendablePa(token)}/${tokenSpendablePa(token)}`
    : "PA: —";
  return withPaChip(
    "Direção da área",
    paChip,
    [
      {
        text: `Clique o hex vizinho ao conjurador — direção do ${shape === "cone" ? "cone" : "raio"}`,
        tone: "ok",
      },
    ],
    true
  );
}
