import { getActorCellMovement } from "../automation/grid-utils.mjs";
import { ELDARIN } from "../config.mjs";

/**
 * Registra Speed Provider no Drag Ruler (verde = caminhada, amarelo = corrida).
 */
export function registerDragRulerIntegration() {
  Hooks.once("dragRuler.ready", (SpeedProvider) => {
    class EldarinSpeedProvider extends SpeedProvider {
      get colors() {
        return [
          {
            id: ELDARIN.DRAG_RULER_COLORS.walk.id,
            default: ELDARIN.DRAG_RULER_COLORS.walk.default,
            name: ELDARIN.DRAG_RULER_COLORS.walk.name,
          },
          {
            id: ELDARIN.DRAG_RULER_COLORS.run.id,
            default: ELDARIN.DRAG_RULER_COLORS.run.default,
            name: ELDARIN.DRAG_RULER_COLORS.run.name,
          },
        ];
      }

      getRanges(token) {
        const actor = token.actor;
        if (!actor || actor.type === "notype") return [];

        const { walk, run } = getActorCellMovement(actor);
        if (walk <= 0 && run <= 0) return [];

        const ranges = [];
        if (walk > 0) {
          ranges.push({ range: walk, color: ELDARIN.DRAG_RULER_COLORS.walk.id });
        }
        if (run > walk) {
          ranges.push({ range: run, color: ELDARIN.DRAG_RULER_COLORS.run.id });
        } else if (run > 0 && run <= walk) {
          ranges.push({ range: run, color: ELDARIN.DRAG_RULER_COLORS.run.id });
        }

        return ranges;
      }

      usesRuler(token) {
        return !!token.actor;
      }
    }

    dragRuler.registerSystem("vinite", EldarinSpeedProvider);
    console.log("Eldarin | Drag Ruler Speed Provider registrado.");
  });
}
