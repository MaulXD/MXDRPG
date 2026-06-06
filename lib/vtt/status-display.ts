import type { TokenCondition } from "@/lib/combat/conditions";
import { conditionSuggestedDurationLabel, CONDITION_SUGGESTED_DURATIONS } from "@/lib/combat/buff-durations";
import { formatTimedEffectRemaining, findTimedEffectForCondition } from "@/lib/combat/timed-effects";
import type { BattleToken } from "@/lib/vtt/types";
import type { TokenEffectChip } from "@/lib/vtt/token-effects";
import { CONDITION_META, formatEffectTooltip } from "@/lib/vtt/token-effects";

export { formatEffectTooltip };

/** @deprecated Use formatEffectTooltip */
export function formatStatusHoverLabel(chip: TokenEffectChip): string {
  return chip.title || formatEffectTooltip(chip);
}

/** Catálogo de condições (mestre) — inclui duração se já estiver ativa no token. */
export function formatConditionCatalogTooltip(
  condition: TokenCondition,
  token?: BattleToken
): string {
  const meta = CONDITION_META[condition];
  const suggested = CONDITION_SUGGESTED_DURATIONS[condition];
  let tip = `${meta.label}: ${meta.description}`;
  if (suggested?.note) tip += ` · Sugestão: ${suggested.note}`;
  else {
    const label = conditionSuggestedDurationLabel(condition);
    if (label) tip += ` · Sugestão: ${label}`;
  }
  if (token?.conditions?.includes(condition)) {
    const fx = findTimedEffectForCondition(token, condition);
    const detail = fx ? formatTimedEffectRemaining(fx) : null;
    if (detail) tip += ` · Duração: ${detail}`;
    else tip += " · Ativo (sem contador)";
  }
  return tip;
}
