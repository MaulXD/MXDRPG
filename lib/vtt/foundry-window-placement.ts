export type MesaWindowId =
  | "actors"
  | "gm"
  | "dungeon"
  | "whiteboard"
  | "tokens"
  | "initiative"
  | "chat"
  | "dice"
  | "ficha"
  | "spawn"
  | "invite"
  | "character"
  | "createCharacter"
  | "monsterSheet"
  | "status"
  | "torFicha"
  | "compendium";

export type FoundryWindowLayout = {
  open: boolean;
  minimized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
};

export const POPUP_EDGE = 16;
export const POPUP_GRID_STEP = 48;
export const POPUP_GAP = 14;

export type PopupRect = { x: number; y: number; w: number; h: number };

export type PopupBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

type Registry = Partial<Record<MesaWindowId, FoundryWindowLayout>>;
type FloatingMap = Partial<Record<MesaWindowId, boolean>>;

export function getWindowsContainerBounds(): PopupBounds {
  const el =
    typeof document !== "undefined" ? document.getElementById("foundry-mesa-windows") : null;
  const width = el?.clientWidth ?? 1280;
  const height = el?.clientHeight ?? 720;
  return {
    width,
    height,
    minX: POPUP_EDGE,
    minY: POPUP_EDGE,
    maxX: Math.max(POPUP_EDGE, width - POPUP_EDGE),
    maxY: Math.max(POPUP_EDGE, height - POPUP_EDGE),
  };
}

export function rectsOverlapWithGap(a: PopupRect, b: PopupRect, gap = POPUP_GAP): boolean {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  );
}

function fitsInBounds(rect: PopupRect, bounds: PopupBounds): boolean {
  return (
    rect.x >= bounds.minX &&
    rect.y >= bounds.minY &&
    rect.x + rect.w <= bounds.width - POPUP_EDGE &&
    rect.y + rect.h <= bounds.height - POPUP_EDGE
  );
}

function collectObstacles(
  id: MesaWindowId,
  registry: Registry,
  floating: FloatingMap
): PopupRect[] {
  return (Object.keys(registry) as MesaWindowId[])
    .filter(
      (wid) =>
        wid !== id &&
        floating[wid] &&
        registry[wid]?.open &&
        !registry[wid]?.minimized
    )
    .map((wid) => {
      const win = registry[wid]!;
      return { x: win.x, y: win.y, w: win.width, h: win.height };
    });
}

function isFree(rect: PopupRect, bounds: PopupBounds, obstacles: PopupRect[]): boolean {
  if (!fitsInBounds(rect, bounds)) return false;
  return !obstacles.some((obs) => rectsOverlapWithGap(rect, obs));
}

/** Varre a área útil e devolve a primeira posição sem sobrepor outras janelas. */
export function computePopupPosition(
  id: MesaWindowId,
  registry: Registry,
  floating: FloatingMap,
  size: { width: number; height: number }
): { x: number; y: number } {
  const bounds = getWindowsContainerBounds();
  const obstacles = collectObstacles(id, registry, floating);
  const candidate: PopupRect = { x: 0, y: 0, w: size.width, h: size.height };

  const maxCol = Math.max(
    1,
    Math.floor((bounds.width - size.width - POPUP_EDGE * 2) / POPUP_GRID_STEP) + 1
  );
  const maxRow = Math.max(
    1,
    Math.floor((bounds.height - size.height - POPUP_EDGE * 2) / POPUP_GRID_STEP) + 1
  );

  for (let row = 0; row < maxRow; row++) {
    for (let col = 0; col < maxCol; col++) {
      candidate.x = bounds.minX + col * POPUP_GRID_STEP;
      candidate.y = bounds.minY + row * POPUP_GRID_STEP;
      if (isFree(candidate, bounds, obstacles)) {
        return { x: candidate.x, y: candidate.y };
      }
    }
  }

  const centerX = Math.round((bounds.width - size.width) / 2);
  const centerY = Math.round((bounds.height - size.height) / 2);
  for (let ring = 0; ring < 12; ring++) {
    for (let row = -ring; row <= ring; row++) {
      for (let col = -ring; col <= ring; col++) {
        if (Math.abs(row) !== ring && Math.abs(col) !== ring) continue;
        candidate.x = Math.min(
          bounds.maxX - size.width,
          Math.max(bounds.minX, centerX + col * POPUP_GRID_STEP)
        );
        candidate.y = Math.min(
          bounds.maxY - size.height,
          Math.max(bounds.minY, centerY + row * POPUP_GRID_STEP)
        );
        if (isFree(candidate, bounds, obstacles)) {
          return { x: candidate.x, y: candidate.y };
        }
      }
    }
  }

  const offset = obstacles.length * 24;
  return {
    x: Math.min(bounds.maxX - size.width, bounds.minX + offset),
    y: Math.min(bounds.maxY - size.height, bounds.minY + offset),
  };
}

export function clampWindowLayout(layout: FoundryWindowLayout): FoundryWindowLayout {
  const bounds = getWindowsContainerBounds();
  const maxX = Math.max(bounds.minX, bounds.width - layout.width - POPUP_EDGE);
  const maxY = Math.max(bounds.minY, bounds.height - layout.height - POPUP_EDGE);
  return {
    ...layout,
    x: Math.min(Math.max(bounds.minX, layout.x), maxX),
    y: Math.min(Math.max(bounds.minY, layout.y), maxY),
  };
}

export function clampDragPosition(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  const bounds = getWindowsContainerBounds();
  const maxX = Math.max(bounds.minX, bounds.width - width - POPUP_EDGE);
  const maxY = Math.max(bounds.minY, bounds.height - height - POPUP_EDGE);
  return {
    x: Math.min(Math.max(bounds.minX, x), maxX),
    y: Math.min(Math.max(bounds.minY, y), maxY),
  };
}
