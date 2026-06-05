import type { BattleToken } from "@/lib/vtt/types";
import type { RoomState } from "./types";

export type CombatTrack = {
  /** IDs de token na ordem de iniciativa (maior primeiro) */
  order: string[];
  activeIndex: number;
  round: number;
  /** Avisos de turno para toast na UI (consumidos no próximo avanço). */
  notices?: string[];
};

export function emptyCombat(tokens: BattleToken[]): CombatTrack {
  return {
    order: tokens.map((t) => t.id),
    activeIndex: 0,
    round: 1,
    notices: [],
  };
}

function agiMod(token: BattleToken, room: RoomState): number {
  if (token.actorId && room.actors[token.actorId]) {
    const des = room.actors[token.actorId].attributes.destreza;
    return Math.floor((des - 10) / 2);
  }
  return Math.floor(Math.random() * 3) - 1;
}

/** 1d20 + mod AGI — estilo Foundry combat tracker */
export function rollInitiative(room: RoomState): { order: string[]; scores: Record<string, number> } {
  const scores: Record<string, number> = {};

  for (const token of room.scene.tokens) {
    const roll = Math.floor(Math.random() * 20) + 1;
    scores[token.id] = roll + agiMod(token, room);
  }

  const order = [...room.scene.tokens]
    .sort((a, b) => {
      const diff = scores[b.id] - scores[a.id];
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    })
    .map((t) => t.id);

  return { order, scores };
}

export function nextTurn(combat: CombatTrack): CombatTrack {
  if (!combat.order.length) return combat;
  const nextIndex = (combat.activeIndex + 1) % combat.order.length;
  return {
    ...combat,
    activeIndex: nextIndex,
    round: nextIndex === 0 ? combat.round + 1 : combat.round,
  };
}

export function activeTokenId(combat: CombatTrack): string | null {
  return combat.order[combat.activeIndex] ?? null;
}
