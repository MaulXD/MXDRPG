import type { BattleToken } from "@/lib/vtt/types";
import type { CharacterSheet } from "@/lib/character/types";

/** Chi renovado a cada combate (Espiritualista). */
export const CHI_POOL_PER_COMBAT = 10;

/** Máximo de Chi gastável por turno. */
export const CHI_SPEND_CAP_PER_TURN = 2;

export function isEspiritualista(actor: Pick<CharacterSheet, "identity">): boolean {
  return actor.identity.classe === "Espiritualista";
}

export function chiMaxForEspiritualista(): number {
  return CHI_POOL_PER_COMBAT;
}

export function resetTokenChi(token: BattleToken, max = CHI_POOL_PER_COMBAT): BattleToken {
  return {
    ...token,
    chi: max,
    chiMax: max,
    chiSpentThisTurn: 0,
  };
}

export function resetChiSpentThisTurn(token: BattleToken): BattleToken {
  return { ...token, chiSpentThisTurn: 0 };
}

export function chiAvailable(token: BattleToken): number {
  return Math.max(0, token.chi ?? 0);
}

export function chiSpentThisTurn(token: BattleToken): number {
  return token.chiSpentThisTurn ?? 0;
}

export function canSpendChi(token: BattleToken, amount: number): boolean {
  if (amount <= 0) return true;
  if (chiAvailable(token) < amount) return false;
  return chiSpentThisTurn(token) + amount <= CHI_SPEND_CAP_PER_TURN;
}

export function spendChi(token: BattleToken, amount: number): BattleToken | null {
  if (!canSpendChi(token, amount)) return null;
  return {
    ...token,
    chi: Math.max(0, chiAvailable(token) - amount),
    chiSpentThisTurn: chiSpentThisTurn(token) + amount,
  };
}
