import type { CharacterSheet } from "@/lib/character/types";
import type { BattleToken } from "@/lib/vtt/types";
import { hasFlanking } from "@/lib/combat/ability";
import { combineRollModes, type RollMode } from "@/lib/combat/d20";

/** Condições Eldarin Cap. 3.4 — subset usado na mesa */
export type TokenCondition =
  | "amedrontado"
  | "cego"
  | "atordoado"
  | "envenenado"
  | "prostrado"
  | "restringido"
  | "encantado";

const ATTACK_DISADV: TokenCondition[] = [
  "amedrontado",
  "cego",
  "envenenado",
  "prostrado",
  "restringido",
];

const ATTACKED_ADV: TokenCondition[] = ["cego", "prostrado", "restringido", "atordoado"];

const SAVE_DISADV: TokenCondition[] = ["envenenado"];

export function tokenConditions(token: BattleToken): TokenCondition[] {
  return token.conditions ?? [];
}

export function hasCondition(token: BattleToken, c: TokenCondition): boolean {
  return tokenConditions(token).includes(c);
}

export function attackRollMode(
  attacker: BattleToken,
  defender: BattleToken,
  allTokens: BattleToken[],
  opts?: { flanking?: boolean }
): RollMode {
  const modes: RollMode[] = [];

  for (const c of tokenConditions(attacker)) {
    if (ATTACK_DISADV.includes(c)) modes.push("disadvantage");
  }
  for (const c of tokenConditions(defender)) {
    if (ATTACKED_ADV.includes(c)) modes.push("advantage");
  }

  if (opts?.flanking || hasFlanking(attacker, defender, allTokens)) {
    modes.push("advantage");
  }

  return combineRollModes(...modes);
}

export function saveRollMode(defender: BattleToken): RollMode {
  const modes: RollMode[] = [];
  for (const c of tokenConditions(defender)) {
    if (SAVE_DISADV.includes(c)) modes.push("disadvantage");
  }
  return combineRollModes(...modes);
}

export function canTokenAct(token: BattleToken): { ok: boolean; reason?: string } {
  if (hasCondition(token, "atordoado")) {
    return { ok: false, reason: "Atordoado — não pode agir" };
  }
  return { ok: true };
}

export function toggleTokenCondition(
  token: BattleToken,
  condition: TokenCondition
): TokenCondition[] {
  const cur = tokenConditions(token);
  if (cur.includes(condition)) return cur.filter((c) => c !== condition);
  return [...cur, condition];
}
