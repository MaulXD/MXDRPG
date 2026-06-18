import type { BattlefieldView } from "@/lib/vtt/battlefield-view";
import { canvasCenter } from "@/lib/vtt/battlefield-view";
import type { Axial } from "@/lib/vtt/grid-math";
import { lodDisplayGridRadiusCap } from "@/lib/vtt/canvas-lod";

/** Células do grid quadrado dentro do raio da cena. */
export function buildCellGrid(gridRadius: number): Axial[] {
  const cells: Axial[] = [];
  const R = gridRadius;
  for (let q = -R; q <= R; q++) {
    for (let r = -R; r <= R; r++) {
      cells.push({ q, r });
    }
  }
  return cells;
}

/** Raio necessário para cobrir o retângulo visível (zoom + pan — evita borda do grid “andando”). */
export function viewportGridRadius(
  w: number,
  h: number,
  cellSize: number,
  view: Pick<BattlefieldView, "scale" | "panX" | "panY"> | number = 1
): number {
  const scale =
    typeof view === "number" ? Math.max(view, 0.01) : Math.max(view.scale, 0.01);
  const panX = typeof view === "number" ? 0 : view.panX;
  const panY = typeof view === "number" ? 0 : view.panY;
  const { ox, oy } = canvasCenter(w, h);
  const size = Math.max(cellSize, 1);

  const relLeft = (panX + ox) / scale;
  const relRight = (w - panX - ox) / scale;
  const relTop = (panY + oy) / scale;
  const relBottom = (h - panY - oy) / scale;

  const cols = Math.max(relLeft, relRight) / size;
  const rows = Math.max(relTop, relBottom) / size;
  return Math.ceil(Math.max(cols, rows)) + 2;
}

/** Limite de raio extra além do da cena — evita dezenas de milhares de células com zoom out. */
export const DISPLAY_GRID_RADIUS_CAP = 24;

/** Raio efetivo do grid de desenho (cena + viewport, com teto). */
export function displayGridRadius(
  sceneRadius: number,
  w: number,
  h: number,
  cellSize: number,
  view: Pick<BattlefieldView, "scale" | "panX" | "panY"> | number = 1
): number {
  const viewScale = typeof view === "number" ? view : view.scale;
  const viewportR = viewportGridRadius(w, h, cellSize, view);
  const radiusCap = lodDisplayGridRadiusCap(viewScale);
  return Math.min(Math.max(sceneRadius, viewportR), Math.max(sceneRadius, radiusCap));
}

/** Grid da cena expandido até preencher o viewport (com teto de performance). */
export function buildDisplayGrid(
  sceneRadius: number,
  w: number,
  h: number,
  cellSize: number,
  view: Pick<BattlefieldView, "scale" | "panX" | "panY"> | number = 1
): Axial[] {
  return buildCellGrid(displayGridRadius(sceneRadius, w, h, cellSize, view));
}
