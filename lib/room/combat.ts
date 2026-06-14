import type { BattleToken } from "@/lib/vtt/types";
import type { RoomState } from "./types";

import type { CombatRoundCheckpoint } from "./combat-round-checkpoint";

export type CombatPendingAutoPass = {
  tokenId: string;
  /** Epoch ms — turno só avança após este instante (PA zerado visível na UI). */
  passAt: number;
};

export type CombatTrack = {
  /** IDs de token na ordem de iniciativa (maior primeiro) */
  order: string[];
  activeIndex: number;
  round: number;
  /** Avisos de turno para toast na UI (consumidos no próximo avanço). */
  notices?: string[];
  /** Ordem da última iniciativa — restaurada pelo mestre. */
  naturalOrder?: string[];
  /** Mestre alterou a fila manualmente. */
  orderOverridden?: boolean;
  /** Auto-passe agendado após esgotar PA (delay antes de `advanceRoomTurn`). */
  pendingAutoPass?: CombatPendingAutoPass;
  /** Checkpoints do mestre (início de rodada, até 20). */
  roundCheckpoints?: CombatRoundCheckpoint[];
};

export function emptyCombat(tokens: BattleToken[] = []): CombatTrack {
  return {
    order: tokens.map((t) => t.id),
    activeIndex: 0,
    round: 1,
    notices: [],
  };
}

/** Garante `order` e índices válidos — evita crash na UI quando o JSON do banco veio incompleto. */
export function normalizeCombatTrack(
  combat: Partial<CombatTrack> | null | undefined,
  tokens: BattleToken[] = []
): CombatTrack {
  if (!combat || !Array.isArray(combat.order)) {
    return emptyCombat(tokens);
  }
  const order = combat.order.filter((id): id is string => typeof id === "string" && id.length > 0);
  if (!order.length) {
    return {
      ...emptyCombat(tokens),
      round: Math.max(1, combat.round ?? 1),
      notices: Array.isArray(combat.notices) ? combat.notices : [],
      naturalOrder: combat.naturalOrder,
      orderOverridden: combat.orderOverridden,
    };
  }
  const maxIdx = order.length - 1;
  const activeIndex = Math.min(Math.max(0, combat.activeIndex ?? 0), maxIdx);
  const pendingAutoPass =
    combat.pendingAutoPass &&
    typeof combat.pendingAutoPass.tokenId === "string" &&
    typeof combat.pendingAutoPass.passAt === "number"
      ? combat.pendingAutoPass
      : undefined;

  return {
    order,
    activeIndex,
    round: Math.max(1, combat.round ?? 1),
    notices: Array.isArray(combat.notices) ? combat.notices : [],
    naturalOrder: combat.naturalOrder,
    orderOverridden: combat.orderOverridden,
    pendingAutoPass,
  };
}

function agiMod(token: BattleToken, room: RoomState): number {
  if (token.actorId && room.actors[token.actorId]) {
    const des = room.actors[token.actorId].attributes.destreza;
    return Math.floor((des - 10) / 2);
  }
  return Math.floor(Math.random() * 3) - 1;
}

function tiebreakD100(): number {
  return Math.floor(Math.random() * 100) + 1;
}

/** 1d20 + mod AGI — desempate: d100 até separar */
export function rollInitiative(room: RoomState): { order: string[]; scores: Record<string, number> } {
  const scores: Record<string, number> = {};
  const tiebreaks: Record<string, number> = {};

  for (const token of room.scene.tokens) {
    const roll = Math.floor(Math.random() * 20) + 1;
    scores[token.id] = roll + agiMod(token, room);
    tiebreaks[token.id] = tiebreakD100();
  }

  const order = [...room.scene.tokens]
    .sort((a, b) => {
      const diff = scores[b.id] - scores[a.id];
      if (diff !== 0) return diff;
      const tb = tiebreaks[b.id] - tiebreaks[a.id];
      if (tb !== 0) return tb;
      return a.name.localeCompare(b.name);
    })
    .map((t) => t.id);

  return { order, scores };
}

export function nextTurn(combat: CombatTrack): CombatTrack {
  if (!combat.order?.length) return combat;
  const nextIndex = (combat.activeIndex + 1) % combat.order.length;
  return {
    ...combat,
    activeIndex: nextIndex,
    round: nextIndex === 0 ? combat.round + 1 : combat.round,
  };
}

export function activeTokenId(combat: CombatTrack): string | null {
  return combat.order?.[combat.activeIndex] ?? null;
}
