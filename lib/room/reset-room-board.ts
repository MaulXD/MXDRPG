import { applyExplorationPaDisplay } from "@/lib/combat/exploration-pa";
import { emptyCombat } from "./combat";
import type { RoomState } from "./types";

/** Zera tabuleiro e estado de combate/PA para recomeçar do zero. */
export function resetRoomBoardForFreshStart(room: RoomState): RoomState {
  const actors = { ...room.actors };
  for (const [id, actor] of Object.entries(actors)) {
    const paMax = actor.resources.pontosAcao.max;
    actors[id] = {
      ...actor,
      resources: {
        ...actor.resources,
        pontosAcao: { ...actor.resources.pontosAcao, value: paMax },
      },
      revision: actor.revision + 1,
    };
  }

  const next: RoomState = {
    ...room,
    settings: { ...room.settings, combatActive: false },
    scene: { ...room.scene, tokens: [] },
    actors,
    combat: emptyCombat(),
    combatUndo: [],
    pings: [],
    revision: room.revision + 1,
    updatedAt: Date.now(),
  };

  applyExplorationPaDisplay(next);
  return next;
}
