import type { CombatActionOption } from "@/lib/combat/types";
import type { BattleToken } from "@/lib/vtt/types";

export type RechargeKind = "per_turn" | "per_combat" | "rounds";

export type RechargeSpec = {
  kind: RechargeKind;
  rounds?: number;
  label: string;
};

export type ActionRechargeState = {
  usedThisTurn?: boolean;
  usedThisCombat?: boolean;
  readyAtRound?: number;
};

/** Recarga padrão de magias sem campo `recarga` no compêndio — mesma magia 1× por turno. */
export const DEFAULT_SPELL_RECHARGE: RechargeSpec = { kind: "per_turn", label: "1/turno" };

/** Magias: `recarga` explícita no JSON; ausente → 1/turno. */
export function resolveSpellRecharge(raw: string | undefined): RechargeSpec {
  return parseRecharge(raw) ?? DEFAULT_SPELL_RECHARGE;
}

/** Interpreta recarga do compêndio (ex. "1/turno", "1/combate", "2 rodadas"). */
export function parseRecharge(raw: string | undefined | null): RechargeSpec | null {
  const s = raw?.trim();
  if (!s) return null;

  const lower = s.toLowerCase();
  if (lower.includes("/turno") || lower.includes("por turno")) {
    return { kind: "per_turn", label: s };
  }
  if (lower.includes("/combate") || lower.includes("por combate")) {
    return { kind: "per_combat", label: s };
  }

  const roundMatch = lower.match(/(\d+)\s*(rodada|round)/);
  if (roundMatch) {
    const rounds = Math.max(1, parseInt(roundMatch[1], 10));
    return { kind: "rounds", rounds, label: s };
  }

  return { kind: "per_turn", label: s };
}

export function rechargeKey(action: CombatActionOption): string {
  return `${action.packId}:${action.entryId}`;
}

export function getActionRechargeState(
  token: BattleToken,
  action: CombatActionOption
): ActionRechargeState | undefined {
  return token.actionRecharge?.[rechargeKey(action)];
}

export function isActionOnRecharge(
  token: BattleToken,
  action: CombatActionOption,
  combatRound: number
): { blocked: boolean; hint?: string } {
  const spec = action.recharge;
  if (!spec) return { blocked: false };

  const state = getActionRechargeState(token, action);
  if (!state) return { blocked: false };

  if (spec.kind === "per_turn" && state.usedThisTurn) {
    return { blocked: true, hint: "próx. turno" };
  }
  if (spec.kind === "per_combat" && state.usedThisCombat) {
    return { blocked: true, hint: "1/combate" };
  }
  if (spec.kind === "rounds" && state.readyAtRound != null && combatRound < state.readyAtRound) {
    const left = state.readyAtRound - combatRound;
    return { blocked: true, hint: left === 1 ? "1 rod." : `${left} rod.` };
  }

  return { blocked: false };
}

export function rechargeBlockReason(
  token: BattleToken,
  action: CombatActionOption,
  combatRound: number
): string | null {
  const cd = isActionOnRecharge(token, action, combatRound);
  if (!cd.blocked) return null;
  const label = action.recharge?.label ?? "recarga";
  return `Em recarga (${label}${cd.hint ? ` · ${cd.hint}` : ""})`;
}

export function markActionRechargeUsed(
  token: BattleToken,
  action: CombatActionOption,
  combatRound: number
): BattleToken {
  const spec = action.recharge;
  if (!spec) return token;

  const key = rechargeKey(action);
  const prev = token.actionRecharge?.[key] ?? {};
  const next: ActionRechargeState = { ...prev };

  if (spec.kind === "per_turn") next.usedThisTurn = true;
  if (spec.kind === "per_combat") next.usedThisCombat = true;
  if (spec.kind === "rounds" && spec.rounds) {
    next.readyAtRound = combatRound + spec.rounds;
  }

  return {
    ...token,
    actionRecharge: { ...token.actionRecharge, [key]: next },
  };
}

export function clearPerTurnRecharges(token: BattleToken): BattleToken {
  if (!token.actionRecharge) return token;

  const next: Record<string, ActionRechargeState> = {};
  let changed = false;

  for (const [k, v] of Object.entries(token.actionRecharge)) {
    if (v.usedThisTurn) {
      changed = true;
      const { usedThisTurn: _drop, ...rest } = v;
      if (Object.keys(rest).length > 0) next[k] = rest;
    } else {
      next[k] = v;
    }
  }

  if (!changed) return token;
  return {
    ...token,
    actionRecharge: Object.keys(next).length > 0 ? next : undefined,
  };
}

export function clearCombatRecharges(tokens: BattleToken[]): BattleToken[] {
  return tokens.map((token) => {
    if (!token.actionRecharge) return token;

    const next: Record<string, ActionRechargeState> = {};
    let changed = false;

    for (const [k, v] of Object.entries(token.actionRecharge)) {
      if (v.usedThisCombat) {
        changed = true;
        const { usedThisCombat: _drop, ...rest } = v;
        if (Object.keys(rest).length > 0) next[k] = rest;
      } else {
        next[k] = v;
      }
    }

    if (!changed) return token;
    return {
      ...token,
      actionRecharge: Object.keys(next).length > 0 ? next : undefined,
    };
  });
}
