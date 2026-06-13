import type { BattleScene } from "@/lib/vtt/types";

export type MapFloorAnchor = {
  x: number;
  y: number;
  scale: number;
};

export type MapAlignedGridLayout = {
  hexSize: number;
  ox: number;
  oy: number;
  /** Quando há piso, mapa + grid + tokens compartilham esta transformação. */
  floorAnchor: MapFloorAnchor | null;
};

export function hasMapFloorImage(scene: Pick<BattleScene, "mapImageUrl">): boolean {
  return Boolean(scene.mapImageUrl?.trim());
}

export function resolveMapFloorAnchor(
  scene: BattleScene,
  canvasOx: number,
  canvasOy: number
): MapFloorAnchor {
  return {
    x: canvasOx + (scene.mapImageOffsetX ?? 0),
    y: canvasOy + (scene.mapImageOffsetY ?? 0),
    scale: scene.mapImageScale ?? 1,
  };
}

/** Escala o piso do mapa em torno do mesmo pivô da imagem (evita drift no zoom). */
export function applyMapFloorTransform(
  ctx: CanvasRenderingContext2D,
  anchor: MapFloorAnchor
): void {
  ctx.translate(anchor.x, anchor.y);
  ctx.scale(anchor.scale, anchor.scale);
  ctx.translate(-anchor.x, -anchor.y);
}

export function worldToMapFloorLocal(
  wx: number,
  wy: number,
  anchor: MapFloorAnchor
): { x: number; y: number } {
  const s = anchor.scale || 1;
  return {
    x: anchor.x + (wx - anchor.x) / s,
    y: anchor.y + (wy - anchor.y) / s,
  };
}

export function mapFloorLocalToWorld(
  lx: number,
  ly: number,
  anchor: MapFloorAnchor
): { x: number; y: number } {
  const s = anchor.scale || 1;
  return {
    x: anchor.x + (lx - anchor.x) * s,
    y: anchor.y + (ly - anchor.y) * s,
  };
}

export function resolveMapAlignedGridLayout(
  scene: BattleScene,
  canvasOx: number,
  canvasOy: number
): MapAlignedGridLayout {
  if (!hasMapFloorImage(scene)) {
    return {
      hexSize: scene.hexSize,
      ox: canvasOx,
      oy: canvasOy,
      floorAnchor: null,
    };
  }

  const anchor = resolveMapFloorAnchor(scene, canvasOx, canvasOy);
  return {
    hexSize: scene.hexSize,
    ox: anchor.x,
    oy: anchor.y,
    floorAnchor: anchor,
  };
}

/** Cena com escala 1 para desenho dentro do grupo do piso (escala via transform). */
export function sceneForMapFloorDraw(scene: BattleScene): BattleScene {
  return { ...scene, mapImageScale: 1 };
}
