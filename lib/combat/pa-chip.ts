import { paNeedForCombatAction } from "@/lib/combat/attack";
import { describePaDiscountNote, listPaModifiersForActor, paCostContextFromToken } from "@/lib/combat/pa-cost-reduce";
import { tokenSpendablePa } from "@/lib/combat/pa-turn";
import { chiAvailable, chiSpentThisTurn, CHI_SPEND_CAP_PER_TURN } from "@/lib/combat/chi-economy";
import type { CombatActionOption } from "@/lib/combat/types";
import type { CharacterSheet } from "@/lib/character/types";
import type { MoveCheck, MovePaOptions } from "@/lib/vtt/movement";
import type { BattleToken } from "@/lib/vtt/types";

const MOD_LABELS: Record<string, string> = {
  "afinidade-arcanica": "Afinidade arcânica",
  "afinidade-divina": "Afinidade divina",
  "afinidade-do-pacto": "Afinidade do pacto",
  "corte-limpo": "Corte limpo",
  "tiro-de-precisao": "Tiro de precisão",
  "chama-controlada": "Chama controlada",
  "rush-doce": "Rush doce",
  "ataque-extra-guerreiro": "Ataque extra",
};

function modifierLabel(id: string): string {
  return MOD_LABELS[id] ?? id.replace(/-/g, " ");
}

export function formatUnifiedPaChip(
  token: BattleToken,
  baseCost: number,
  effectiveCost: number,
  modifierNote?: string | null
): string {
  const spendable = tokenSpendablePa(token);
  const after = Math.max(0, spendable - effectiveCost);

  let costPart: string;
  if (baseCost === effectiveCost) {
    costPart = `PA: ${effectiveCost}`;
  } else if (modifierNote) {
    costPart = `PA: ${baseCost} → ${effectiveCost} (${modifierNote})`;
  } else {
    costPart = `PA: ${baseCost} → ${effectiveCost}`;
  }

  return `${costPart} · Restam ${after}/${spendable}`;
}

function actionModifierNote(
  actor: CharacterSheet | null,
  action: CombatActionOption,
  token: BattleToken
): string | null {
  if (!actor) return null;
  const ctx = paCostContextFromToken(token);
  const ids = listPaModifiersForActor(actor, action, ctx);
  if (ids.length === 0) return null;
  return (
    describePaDiscountNote(token, action, ids) ??
    (ids.length === 1 ? modifierLabel(ids[0]!) : `${ids.length} reduções`)
  );
}

export function unifiedPaChipForAction(
  token: BattleToken,
  actor: CharacterSheet | null,
  action: CombatActionOption,
  channelExtraPa = 0
): string {
  const base =
    action.channelMaxExtraPa != null
      ? action.paCost + channelExtraPa
      : action.paCost;
  const effective = paNeedForCombatAction(token, actor, action, channelExtraPa);
  const paChip = formatUnifiedPaChip(token, base, effective, actionModifierNote(actor, action, token));

  if (action.chiCost) {
    const chiAfter = Math.max(0, chiAvailable(token) - action.chiCost);
    const chiMax = token.chiMax ?? 10;
    const spentTurn = chiSpentThisTurn(token) + action.chiCost;
    const turnLeft = CHI_SPEND_CAP_PER_TURN - spentTurn;
    return `${paChip}  ·  Chi: ${action.chiCost} · χ ${chiAfter}/${chiMax} · turno ${turnLeft < 0 ? "excede limite" : `${Math.max(0, turnLeft)} restante`}`;
  }

  return paChip;
}

export function unifiedPaChipForMove(
  token: BattleToken,
  check: MoveCheck,
  paOpts?: MovePaOptions
): string {
  const raw = check.rawPaCost ?? check.paCost;
  const eff = check.paCost;
  let note: string | null = null;
  if (paOpts?.freeBasicMovePa && raw > eff) note = "O Peão";
  else if (raw > eff) note = "redução";
  return formatUnifiedPaChip(token, raw, eff, note);
}
