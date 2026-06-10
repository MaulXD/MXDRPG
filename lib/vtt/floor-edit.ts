import type { BattlefieldView } from "@/lib/vtt/battlefield-view";
import { canvasCenter, worldToScreen } from "@/lib/vtt/battlefield-view";
import type { CanvasLayout } from "@/lib/vtt/draw-battlefield";
import { computeMapImageRect } from "@/lib/vtt/draw-map-overlay";
import type { BattleScene } from "@/lib/vtt/types";

export const MAP_IMAGE_SCALE_MIN = 0.25;
export const MAP_IMAGE_SCALE_MAX = 4;

export type FloorResizeHandle = "nw" | "ne" | "se" | "sw";

const HANDLE_CURSORS: Record<FloorResizeHandle, string> = {
  nw: "nwse-resize",
  ne: "nesw-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
};

export function clampMapImageScale(scale: number): number {
  return Math.min(MAP_IMAGE_SCALE_MAX, Math.max(MAP_IMAGE_SCALE_MIN, scale));
}

export function floorHandleWorldPositions(rect: { x: number; y: number; w: number; h: number }) {
  const { x, y, w, h } = rect;
  return {
    nw: { x, y },
    ne: { x: x + w, y },
    se: { x: x + w, y: y + h },
    sw: { x, y: y + h },
  };
}

export function floorResizeCursor(handle: FloorResizeHandle | null, dragging: boolean): string {
  if (dragging) return "grabbing";
  if (handle) return HANDLE_CURSORS[handle];
  return "grab";
}

export function hitTestFloorHandle(
  px: number,
  py: number,
  img: HTMLImageElement,
  scene: BattleScene,
  layout: CanvasLayout,
  view: BattlefieldView,
  hitRadius = 18
): FloorResizeHandle | null {
  const rect = computeMapImageRect(img, scene, layout);
  const { w: cw, h: ch } = layout;
  const handles = floorHandleWorldPositions(rect);
  let best: { id: FloorResizeHandle; dist: number } | null = null;

  for (const [id, pos] of Object.entries(handles) as [FloorResizeHandle, { x: number; y: number }][]) {
    const screen = worldToScreen(pos.x, pos.y, cw, ch, view);
    const dist = Math.hypot(px - screen.x, py - screen.y);
    if (dist <= hitRadius && (!best || dist < best.dist)) {
      best = { id, dist };
    }
  }
  return best?.id ?? null;
}

export function pointInFloorRect(
  wx: number,
  wy: number,
  img: HTMLImageElement,
  scene: BattleScene,
  layout: CanvasLayout
): boolean {
  const rect = computeMapImageRect(img, scene, layout);
  return wx >= rect.x && wx <= rect.x + rect.w && wy >= rect.y && wy <= rect.y + rect.h;
}

/** Mantém o canto oposto fixo ao redimensionar. */
export function floorScaleFromHandleDrag(
  handle: FloorResizeHandle,
  worldX: number,
  worldY: number,
  startRect: { x: number; y: number; w: number; h: number },
  startScale: number
): number {
  const { x, y, w, h } = startRect;
  const startDiag = Math.max(24, Math.hypot(w, h));
  let nextDiag = startDiag;

  switch (handle) {
    case "se":
      nextDiag = Math.max(24, Math.hypot(worldX - x, worldY - y));
      break;
    case "nw":
      nextDiag = Math.max(24, Math.hypot(x + w - worldX, y + h - worldY));
      break;
    case "ne":
      nextDiag = Math.max(24, Math.hypot(worldX - x, y + h - worldY));
      break;
    case "sw":
      nextDiag = Math.max(24, Math.hypot(x + w - worldX, worldY - y));
      break;
  }

  return clampMapImageScale(startScale * (nextDiag / startDiag));
}

export function floorOffsetForAnchoredScale(
  handle: FloorResizeHandle,
  startRect: { x: number; y: number; w: number; h: number },
  newScale: number,
  img: HTMLImageElement,
  layout: CanvasLayout,
  startOffX: number,
  startOffY: number,
  _startScale: number
): { offsetX: number; offsetY: number } {
  const { x, y, w, h } = startRect;
  const fitNext =
    Math.max(layout.w / img.naturalWidth, layout.h / img.naturalHeight) * newScale;
  const wNext = img.naturalWidth * fitNext;
  const hNext = img.naturalHeight * fitNext;

  /** Canto oposto ao handle — permanece fixo no mundo ao redimensionar. */
  let newX: number;
  let newY: number;
  switch (handle) {
    case "se":
      newX = x;
      newY = y;
      break;
    case "nw":
      newX = x + w - wNext;
      newY = y + h - hNext;
      break;
    case "ne":
      newX = x;
      newY = y + h - hNext;
      break;
    case "sw":
      newX = x + w - wNext;
      newY = y;
      break;
  }

  const offX = newX - (layout.ox - wNext / 2);
  const offY = newY - (layout.oy - hNext / 2);

  if (!Number.isFinite(offX) || !Number.isFinite(offY)) {
    return { offsetX: startOffX, offsetY: startOffY };
  }

  return { offsetX: offX, offsetY: offY };
}

export function drawFloorEditOverlay(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  scene: BattleScene,
  layout: CanvasLayout,
  viewScale: number
): void {
  const rect = computeMapImageRect(img, scene, layout);
  const handles = floorHandleWorldPositions(rect);
  const handleR = Math.max(5, 8 / viewScale);

  ctx.save();
  ctx.strokeStyle = "rgba(212, 179, 86, 0.95)";
  ctx.lineWidth = Math.max(1.5, 2 / viewScale);
  ctx.setLineDash([6 / viewScale, 4 / viewScale]);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(212, 179, 86, 0.98)";
  ctx.strokeStyle = "rgba(20, 16, 10, 0.85)";
  ctx.lineWidth = Math.max(1, 1.5 / viewScale);

  for (const pos of Object.values(handles)) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, handleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
