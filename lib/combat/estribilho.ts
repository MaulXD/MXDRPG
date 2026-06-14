import { spellMeta } from "@/lib/character/spell-prep";
import type { BattleToken } from "@/lib/vtt/types";

/** Magias nv. 0 (ex-cantrip / truque). */
export const ESTRIBILHO_MAX_SAME_PER_TURN = 2;

export function isEstribilho(spellEntryId: string): boolean {
  return spellMeta(spellEntryId).level === 0;
}

/** @deprecated Use `isEstribilho`. */
export const isCantripSpell = isEstribilho;

export function estribilhoCastCount(token: BattleToken, spellEntryId: string): number {
  return token.estribilhoCasts?.[spellEntryId] ?? 0;
}

export function checkEstribilhoLimit(
  token: BattleToken,
  spellEntryId: string
): { ok: true } | { ok: false; reason: string } {
  if (!isEstribilho(spellEntryId)) return { ok: true };
  const used = estribilhoCastCount(token, spellEntryId);
  if (used >= ESTRIBILHO_MAX_SAME_PER_TURN) {
    const name = spellMeta(spellEntryId).name;
    return {
      ok: false,
      reason: `Limite de estribilhos: no máximo ${ESTRIBILHO_MAX_SAME_PER_TURN}× ${name} por turno`,
    };
  }
  return { ok: true };
}

export function recordEstribilhoCast(token: BattleToken, spellEntryId: string): BattleToken {
  if (!isEstribilho(spellEntryId)) return token;
  const prev = { ...(token.estribilhoCasts ?? {}) };
  prev[spellEntryId] = (prev[spellEntryId] ?? 0) + 1;
  return { ...token, estribilhoCasts: prev };
}

export function clearEstribilhoCastsOnTurnStart(token: BattleToken): BattleToken {
  if (!token.estribilhoCasts) return token;
  const { estribilhoCasts: _e, ...rest } = token;
  return rest;
}
