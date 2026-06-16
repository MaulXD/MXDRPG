import { resolveCombatPaPhase, type CombatPaPhase } from "@/lib/combat/combat-pa-phase";
import { tokenPaSpentThisTurn, tokenSpendablePa } from "@/lib/combat/pa-turn";
import { activeTokenId } from "@/lib/room/combat";
import type { RoomState } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

export type CombatLogKind =
  | "pa_spend"
  | "pa_refresh"
  | "pa_bank"
  | "turn_start"
  | "turn_pass"
  | "auto_pass"
  | "initiative"
  | "combat_on"
  | "combat_off"
  | "repair"
  | "spawn"
  | "pools_zero";

export type CombatLogEntry = {
  id: string;
  at: number;
  round: number;
  phase: CombatPaPhase;
  kind: CombatLogKind;
  tokenId?: string;
  tokenName?: string;
  summary: string;
  paBefore?: number;
  paAfter?: number;
  paCost?: number;
  paSpentThisTurn?: number;
  bankedPa?: number;
  activeTokenId?: string | null;
  detail?: string;
  actionKind?: string;
};

const MAX_COMBAT_LOG = 150;

function newLogId(): string {
  return `clog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function logContext(room: RoomState): Pick<CombatLogEntry, "round" | "phase" | "activeTokenId"> {
  return {
    round: room.combat.round,
    phase: resolveCombatPaPhase(room.settings, room.combat),
    activeTokenId: activeTokenId(room.combat),
  };
}

export function clearCombatLog(room: RoomState): void {
  room.combatLog = [];
}

export function appendCombatLog(
  room: RoomState,
  entry: Omit<CombatLogEntry, "id" | "at" | "round" | "phase" | "activeTokenId">
): CombatLogEntry {
  const full: CombatLogEntry = {
    id: newLogId(),
    at: Date.now(),
    ...logContext(room),
    ...entry,
  };
  const stack = [...(room.combatLog ?? []), full];
  room.combatLog = stack.length > MAX_COMBAT_LOG ? stack.slice(-MAX_COMBAT_LOG) : stack;
  return full;
}

function paSnapshot(token: BattleToken): {
  pa: number;
  paSpentThisTurn: number;
  bankedPa?: number;
} {
  return {
    pa: tokenSpendablePa(token),
    paSpentThisTurn: tokenPaSpentThisTurn(token),
    bankedPa: token.bankedPa,
  };
}

const ACTION_LABEL: Record<string, string> = {
  weapon: "ataque",
  spell: "magia",
  ability: "habilidade",
  unarmed: "desarmado",
  move: "movimento",
};

export function logPaSpend(
  room: RoomState,
  tokenBefore: BattleToken,
  tokenAfter: BattleToken,
  cost: number,
  opts?: { summary?: string; actionKind?: string }
): void {
  const before = paSnapshot(tokenBefore);
  const after = paSnapshot(tokenAfter);
  const action = opts?.actionKind ? ACTION_LABEL[opts.actionKind] ?? opts.actionKind : null;
  const summary =
    opts?.summary ??
    (action ? `Gastou ${cost} PA (${action})` : `Gastou ${cost} PA`);

  appendCombatLog(room, {
    kind: "pa_spend",
    tokenId: tokenBefore.id,
    tokenName: tokenBefore.name,
    summary,
    paBefore: before.pa,
    paAfter: after.pa,
    paCost: cost,
    paSpentThisTurn: after.paSpentThisTurn,
    bankedPa: after.bankedPa,
    actionKind: opts?.actionKind,
  });
}

export function logPaRefresh(
  room: RoomState,
  token: BattleToken,
  opts: { mode: "full" | "regen"; paBefore: number; reason: string }
): void {
  const after = paSnapshot(token);
  appendCombatLog(room, {
    kind: "pa_refresh",
    tokenId: token.id,
    tokenName: token.name,
    summary: `PA ${opts.mode === "full" ? "cheio" : "refresh"}: ${opts.paBefore} → ${after.pa}`,
    paBefore: opts.paBefore,
    paAfter: after.pa,
    paSpentThisTurn: after.paSpentThisTurn,
    bankedPa: after.bankedPa,
    detail: opts.reason,
  });
}

export function logPaBank(
  room: RoomState,
  tokenBefore: BattleToken,
  tokenAfter: BattleToken,
  discarded?: number
): void {
  const before = paSnapshot(tokenBefore);
  const after = paSnapshot(tokenAfter);
  const summary =
    discarded && discarded > 0
      ? `Banco PA: ${before.pa} → pool ${after.bankedPa ?? 0} (descartou ${discarded})`
      : `Banco PA: ${before.pa} → pool ${after.bankedPa ?? 0}`;

  appendCombatLog(room, {
    kind: "pa_bank",
    tokenId: tokenBefore.id,
    tokenName: tokenBefore.name,
    summary,
    paBefore: before.pa,
    paAfter: after.pa,
    bankedPa: after.bankedPa,
    paSpentThisTurn: 0,
    detail: discarded ? `descartou ${discarded}` : undefined,
  });
}

export function logCombatEvent(
  room: RoomState,
  kind: CombatLogKind,
  summary: string,
  opts?: {
    tokenId?: string;
    tokenName?: string;
    detail?: string;
    paBefore?: number;
    paAfter?: number;
  }
): void {
  appendCombatLog(room, {
    kind,
    summary,
    tokenId: opts?.tokenId,
    tokenName: opts?.tokenName,
    detail: opts?.detail,
    paBefore: opts?.paBefore,
    paAfter: opts?.paAfter,
  });
}
