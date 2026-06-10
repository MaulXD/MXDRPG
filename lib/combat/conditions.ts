import type { CombatActionOption } from "@/lib/combat/types";
import { hasFlanking } from "@/lib/combat/ability";
import { combineRollModes, formatRollMode, type RollMode } from "@/lib/combat/d20";
import { axialDistance } from "@/lib/vtt/hex-math";
import type { BattleToken } from "@/lib/vtt/types";

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

const SAVE_DISADV: TokenCondition[] = ["amedrontado", "envenenado", "restringido"];

const CONDITION_ATTACK_DISADV_LABEL: Partial<Record<TokenCondition, string>> = {
  amedrontado: "amedrontado",
  cego: "cego",
  envenenado: "envenenado",
  prostrado: "prostrado",
  restringido: "restringido",
};

const CONDITION_ATTACKED_ADV_LABEL: Partial<Record<TokenCondition, string>> = {
  cego: "alvo cego",
  prostrado: "alvo prostrado",
  restringido: "alvo restringido",
  atordoado: "alvo atordoado",
};

const CONDITION_SAVE_DISADV_LABEL: Partial<Record<TokenCondition, string>> = {
  amedrontado: "amedrontado",
  envenenado: "envenenado",
  restringido: "restringido",
};

export function tokenConditions(token: BattleToken): TokenCondition[] {
  return token.conditions ?? [];
}

export function hasCondition(token: BattleToken, c: TokenCondition): boolean {
  return tokenConditions(token).includes(c);
}

/** Buffs temporários do token (chips da mesa) que afetam o d20 de ataque. */
export function tokenBuffAttackRollMode(
  attacker: BattleToken,
  defender: BattleToken,
  action?: CombatActionOption
): { mode: RollMode; sources: string[] } {
  const modes: RollMode[] = [];
  const sources: string[] = [];
  const rangeHex = action?.rangeHex ?? 1;

  if (attacker.allyAttackAdvantage) {
    modes.push("advantage");
    sources.push("inspiração");
  }
  if (attacker.rangedAttackAdvantage && rangeHex > 1) {
    modes.push("advantage");
    sources.push("tiro certeiro");
  }
  if (attacker.weakened) {
    modes.push("disadvantage");
    sources.push("enfraquecido");
  }
  if (attacker.attackMark?.attackerDisadvantage) {
    modes.push("disadvantage");
    sources.push("finta");
  }

  const mark = attacker.attackMark;
  if (mark && mark.targetId === defender.id && !mark.attackerDisadvantage) {
    const melee = rangeHex <= 1;
    if (!mark.rangedOnly || !melee) {
      if (mark.advantage || mark.bonus) {
        modes.push("advantage");
        sources.push("marca");
      }
    }
  }

  if (action?.name === "Emboscada" && axialDistance(attacker.axial, defender.axial) <= 1) {
    modes.push("advantage");
    sources.push("emboscada");
  }

  return { mode: combineRollModes(...modes), sources };
}

export type AttackRollModeDetail = {
  mode: RollMode;
  sources: string[];
};

export function attackRollModeDetail(
  attacker: BattleToken,
  defender: BattleToken,
  allTokens: BattleToken[],
  opts?: { flanking?: boolean; action?: CombatActionOption }
): AttackRollModeDetail {
  const modes: RollMode[] = [];
  const sources: string[] = [];

  for (const c of tokenConditions(attacker)) {
    if (ATTACK_DISADV.includes(c)) {
      modes.push("disadvantage");
      const label = CONDITION_ATTACK_DISADV_LABEL[c];
      if (label) sources.push(label);
    }
  }
  for (const c of tokenConditions(defender)) {
    if (ATTACKED_ADV.includes(c)) {
      modes.push("advantage");
      const label = CONDITION_ATTACKED_ADV_LABEL[c];
      if (label) sources.push(label);
    }
  }

  if (opts?.flanking || hasFlanking(attacker, defender, allTokens)) {
    modes.push("advantage");
    sources.push("flanqueio");
  }

  const buff = tokenBuffAttackRollMode(attacker, defender, opts?.action);
  if (buff.mode !== "normal") modes.push(buff.mode);
  sources.push(...buff.sources);

  return { mode: combineRollModes(...modes), sources };
}

export function attackRollMode(
  attacker: BattleToken,
  defender: BattleToken,
  allTokens: BattleToken[],
  opts?: { flanking?: boolean; action?: CombatActionOption }
): RollMode {
  return attackRollModeDetail(attacker, defender, allTokens, opts).mode;
}

export function saveRollModeDetail(defender: BattleToken): AttackRollModeDetail {
  const modes: RollMode[] = [];
  const sources: string[] = [];
  for (const c of tokenConditions(defender)) {
    if (SAVE_DISADV.includes(c)) {
      modes.push("disadvantage");
      const label = CONDITION_SAVE_DISADV_LABEL[c];
      if (label) sources.push(label);
    }
  }
  if (defender.weakened) {
    modes.push("disadvantage");
    sources.push("enfraquecido");
  }
  return { mode: combineRollModes(...modes), sources };
}

export function saveRollMode(defender: BattleToken): RollMode {
  return saveRollModeDetail(defender).mode;
}

export function formatRollModeWithSources(mode: RollMode, sources: string[]): string {
  if (mode === "normal") return "";
  const tag = formatRollMode(mode);
  const unique = [...new Set(sources.filter(Boolean))];
  if (!unique.length) return tag;
  return `${tag} (${unique.join(", ")})`;
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
