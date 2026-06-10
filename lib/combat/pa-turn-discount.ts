import { paDiscountKindForAction, type PaDiscountKind } from "@/lib/character/pa-modifiers";
import type { CombatActionOption } from "@/lib/combat/types";
import type { BattleToken } from "@/lib/vtt/types";

/** Desconto −PA já usado neste turno, por tipo de ação (Cap. 12.0). */
export type PaDiscountUsed = Partial<Record<PaDiscountKind, boolean>>;

export function readPaDiscountUsed(token: BattleToken): PaDiscountUsed {
  if (token.paDiscountUsed) return token.paDiscountUsed;
  const legacy: PaDiscountUsed = {};
  if (token.paReduceWeaponUsed) legacy.weapon = true;
  if (token.paReduceSpellUsed) legacy.spell = true;
  if (token.paReduceAbilityUsed) legacy.ability = true;
  return legacy;
}

export function isPaDiscountAvailable(token: BattleToken, kind: PaDiscountKind): boolean {
  return !readPaDiscountUsed(token)[kind];
}

export function clearPaDiscountUsed<T extends BattleToken>(token: T): T {
  const next = { ...token };
  delete next.paDiscountUsed;
  delete next.paReduceWeaponUsed;
  delete next.paReduceSpellUsed;
  delete next.paReduceAbilityUsed;
  delete next.onKillPaGranted;
  return next;
}

export function markPaDiscountUsed(
  token: BattleToken,
  kind?: CombatActionOption["kind"]
): BattleToken {
  const discountKind = kind ? paDiscountKindForAction(kind) : null;
  if (!discountKind) return token;
  const used = { ...readPaDiscountUsed(token) };
  used[discountKind] = true;
  return {
    ...token,
    paDiscountUsed: used,
    paReduceWeaponUsed: used.weapon ?? false,
    paReduceSpellUsed: used.spell ?? false,
    paReduceAbilityUsed: used.ability ?? false,
  };
}
