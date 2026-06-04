import type { CharacterSheet } from "@/lib/character/types";
import { effectivePaCost } from "@/lib/combat/pa-economy";
import type { CombatActionOption } from "@/lib/combat/types";

/** PA extras investidos na mesma conjuração (regra mesa digital). */
export const CHANNEL_MAX_EXTRA_PA = 2;

export const CHANNEL_BONUS_PER_PA = "1d6";

/** IDs das 10 magias canalizáveis no compêndio. */
export const CHANNEL_SPELL_ENTRY_IDS = [
  "magias-maos-gelidas",
  "magias-chama-de-vinha",
  "magias-onda-de-trovao",
  "magias-esfera-acida-de-monstro",
  "magias-relampago",
  "magias-bola-de-fogo",
  "magias-raio-do-limiar",
  "magias-murcha",
  "magias-cone-de-frio",
  "magias-cadeia-de-relampago",
] as const;

export type SpellChannelSpec = {
  maxExtraPa: number;
  bonusPerPa?: string;
};

export function parseSpellChannel(raw: unknown): SpellChannelSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { maxExtraPa?: number; bonusPerPa?: string };
  const max = o.maxExtraPa;
  if (typeof max !== "number" || max < 1) return null;
  return {
    maxExtraPa: Math.min(CHANNEL_MAX_EXTRA_PA, Math.floor(max)),
    bonusPerPa: o.bonusPerPa?.trim() || CHANNEL_BONUS_PER_PA,
  };
}

export function parseChannelExtraPa(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function clampChannelExtraPa(action: CombatActionOption, extra: number): number {
  if (!action.channelMaxExtraPa) return 0;
  return Math.min(action.channelMaxExtraPa, Math.max(0, Math.floor(extra)));
}

export function channelDamageFormula(
  baseFormula: string,
  extraPa: number,
  bonusPerPa = CHANNEL_BONUS_PER_PA
): string {
  if (extraPa <= 0) return baseFormula;
  if (bonusPerPa === "1d6") return `${baseFormula}+${extraPa}d6`;
  return `${baseFormula}+${bonusPerPa}`;
}

export function actionWithChannel(
  action: CombatActionOption,
  extraPa: number
): CombatActionOption {
  const extra = clampChannelExtraPa(action, extraPa);
  if (extra <= 0) return action;
  const bonus = action.channelBonusPerPa ?? CHANNEL_BONUS_PER_PA;
  return {
    ...action,
    damageFormula: channelDamageFormula(action.damageFormula, extra, bonus),
  };
}

/** PA base (com reduções de classe/talento) + extras de canalização (sem redução). */
export function totalChannelPaCost(
  actor: CharacterSheet | null,
  action: CombatActionOption,
  extraPa: number
): number {
  const extra = clampChannelExtraPa(action, extraPa);
  const base = effectivePaCost(actor, action);
  return base + extra;
}

export function formatChannelPaLabel(
  actor: CharacterSheet | null,
  action: CombatActionOption,
  extraPa: number
): string {
  if (!action.channelMaxExtraPa) {
    const cost = effectivePaCost(actor, action);
    return `PA ${cost}`;
  }
  const extra = clampChannelExtraPa(action, extraPa);
  const base = effectivePaCost(actor, action);
  const total = base + extra;
  const bonus = action.channelBonusPerPa ?? CHANNEL_BONUS_PER_PA;
  if (extra === 0) {
    return `PA ${base} (até +${action.channelMaxExtraPa} canal. · ${bonus}/PA extra)`;
  }
  return `PA ${total} (${base}+${extra} canal.) · +${extra}×${bonus}`;
}
