import { tickTokenTimedEffectsOnTurnStart, type CombatTickContext } from "@/lib/combat/timed-effects";
import { resetTokenMovement } from "@/lib/vtt/movement";
import type { RoomState } from "../types";

/**
 * Reinicia movimento (hex gastos) no início de cada turno.
 * PA (pool, bankedPa, paSpentThisTurn) é tratado só em `handlers/combat-turn.ts`.
 */
export function resetAllTokenMovement(room: RoomState, notices?: string[]): void {
  const activeId = room.combat.order[room.combat.activeIndex] ?? null;
  const ctx: CombatTickContext = {
    round: room.combat.round,
    activeIndex: room.combat.activeIndex,
  };
  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      let next = resetTokenMovement(t);
      if (t.id === activeId) {
        const tick = tickTokenTimedEffectsOnTurnStart(next, ctx);
        next = tick.token;
        for (const fx of tick.expired) {
          notices?.push(`${t.name}: ${fx.label} expirou.`);
        }
      }
      return next;
    }),
  };
}
