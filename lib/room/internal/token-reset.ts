import { resetTokenMovement } from "@/lib/vtt/movement";
import type { RoomState } from "../types";

/**
 * Reinicia movimento (hex gastos) no início de cada turno.
 * PA (pool, bankedPa, paSpentThisTurn) é tratado só em `handlers/combat-turn.ts`.
 */
export function resetAllTokenMovement(room: RoomState): void {
  const activeId = room.combat.order[room.combat.activeIndex] ?? null;
  room.scene = {
    ...room.scene,
    tokens: room.scene.tokens.map((t) => {
      const reset = resetTokenMovement(t);
      if (t.id === activeId && (t.defesaBonus ?? 0) > 0) {
        return {
          ...reset,
          defesaBonus: undefined,
          defesaBuffSource: undefined,
        };
      }
      return reset;
    }),
  };
}
