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
  /** Iniciativa já foi rolada (ordem por AGI); senão, ordem = posição no mapa. */
  initiativeRolled?: boolean;
  /** Auto-passe agendado após esgotar PA (delay antes de `advanceRoomTurn`). */
  pendingAutoPass?: CombatPendingAutoPass;
  /** Último turno com PA restaurado (`round:tokenId`) — evita re-refresh no meio do turno. */
  paRefreshTurnKey?: string;
  /** Checkpoints do mestre (início de rodada, até 20). */
  roundCheckpoints?: CombatRoundCheckpoint[];
};

/** Combate sem iniciativa — ordem vazia até o mestre rolar. */
export function emptyCombat(): CombatTrack {
  return {
    order: [],
    activeIndex: 0,
    round: 1,
    notices: [],
  };
}

function validTokenIds(tokens: BattleToken[]): Set<string> {
  return new Set(tokens.map((t) => t.id));
}

function clearStaleCombatPaState(
  combat: Partial<CombatTrack>,
  order: string[],
  activeIndex: number
): Pick<CombatTrack, "pendingAutoPass" | "paRefreshTurnKey"> {
  const activeId = order[activeIndex] ?? null;
  let pendingAutoPass = combat.pendingAutoPass;
  if (pendingAutoPass && pendingAutoPass.tokenId !== activeId) {
    pendingAutoPass = undefined;
  }

  let paRefreshTurnKey =
    typeof combat.paRefreshTurnKey === "string" && combat.paRefreshTurnKey.length > 0
      ? combat.paRefreshTurnKey
      : undefined;
  if (paRefreshTurnKey) {
    const colon = paRefreshTurnKey.indexOf(":");
    const keyRound = colon >= 0 ? paRefreshTurnKey.slice(0, colon) : "";
    const tokenId = colon >= 0 ? paRefreshTurnKey.slice(colon + 1) : "";
    const activeId = order[activeIndex] ?? "";
    const roundStr = String(Math.max(1, combat.round ?? 1));
    if (
      !tokenId ||
      !order.includes(tokenId) ||
      tokenId !== activeId ||
      keyRound !== roundStr
    ) {
      paRefreshTurnKey = undefined;
    }
  }

  return { pendingAutoPass, paRefreshTurnKey };
}

/** Garante `order` e índices válidos — remove IDs órfãos e PA/turno legados. */
export function normalizeCombatTrack(
  combat: Partial<CombatTrack> | null | undefined,
  tokens: BattleToken[] = []
): CombatTrack {
  if (!combat || !Array.isArray(combat.order)) {
    return emptyCombat();
  }

  const validIds = validTokenIds(tokens);
  const order = combat.order.filter(
    (id): id is string => typeof id === "string" && id.length > 0 && validIds.has(id)
  );

  if (!order.length) {
    return {
      order: [],
      activeIndex: 0,
      round: Math.max(1, combat.round ?? 1),
      notices: [],
    };
  }

  const maxIdx = order.length - 1;
  const activeIndex = Math.min(Math.max(0, combat.activeIndex ?? 0), maxIdx);
  const stale = clearStaleCombatPaState(combat, order, activeIndex);

  return {
    order,
    activeIndex,
    round: Math.max(1, combat.round ?? 1),
    notices: Array.isArray(combat.notices) ? combat.notices : [],
    naturalOrder: Array.isArray(combat.naturalOrder)
      ? combat.naturalOrder.filter((id) => validIds.has(id))
      : undefined,
    orderOverridden: combat.orderOverridden,
    initiativeRolled: combat.initiativeRolled,
    pendingAutoPass: stale.pendingAutoPass,
    paRefreshTurnKey: stale.paRefreshTurnKey,
    roundCheckpoints: combat.roundCheckpoints,
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
