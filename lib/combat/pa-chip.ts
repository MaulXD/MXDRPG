import {
  effectivePaCost,
  listPaModifiersForActor,
  totalAttackPaCost,
} from "@/lib/combat/pa-economy";
import { totalChannelPaCost } from "@/lib/combat/spell-channel";
import { tokenSpendablePa } from "@/lib/combat/pa-turn";
import type { CombatActionOption } from "@/lib/combat/types";
import type { CharacterSheet } from "@/lib/character/types";
import type { MoveCheck, MovePaOptions } from "@/lib/vtt/movement";
import type { BattleToken } from "@/lib/vtt/types";

const MOD_LABELS: Record<string, string> = {
  "afinidade-arcanica": "Afinidade",
  "corte-limpo": "Corte limpo",
  "rush-doce": "Rush doce",
  "ataque-extra-guerreiro": "Guerreiro",
  "o-peao": "O Peão",
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
  action: CombatActionOption
): string | null {
  if (!actor) return null;
  const ids = listPaModifiersForActor(actor, action);
  if (ids.length === 0) return null;
  return modifierLabel(ids[0]);
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
  const effective = actor
    ? action.channelMaxExtraPa
      ? totalChannelPaCost(actor, action, channelExtraPa)
      : action.kind === "weapon"
        ? totalAttackPaCost(actor, action)
        : effectivePaCost(actor, action)
    : base;
  return formatUnifiedPaChip(token, base, effective, actionModifierNote(actor, action));
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
