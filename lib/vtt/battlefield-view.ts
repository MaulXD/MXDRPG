export type BattlefieldView = {
  scale: number;
  panX: number;
  panY: number;
};

/** Zoom inicial e ao resetar vista (20% mais próximo que 100%). */
export const BATTLEFIELD_DEFAULT_SCALE = 1.2;

export const DEFAULT_BATTLEFIELD_VIEW: BattlefieldView = {
  scale: BATTLEFIELD_DEFAULT_SCALE,
  panX: 0,
  panY: 0,
};

export const BATTLEFIELD_SCALE_MIN = 0.45;
export const BATTLEFIELD_SCALE_MAX = 2.5;

export function clampBattlefieldScale(scale: number): number {
  return Math.min(BATTLEFIELD_SCALE_MAX, Math.max(BATTLEFIELD_SCALE_MIN, scale));
}

export function canvasCenter(w: number, h: number): { ox: number; oy: number } {
  return { ox: w / 2, oy: h / 2 };
}

/** Converte coordenada do canvas (CSS px) para espaço do tabuleiro. */
export function screenToWorld(
  px: number,
  py: number,
  w: number,
  h: number,
  view: BattlefieldView
): { x: number; y: number } {
  const { ox, oy } = canvasCenter(w, h);
  return {
    x: (px - view.panX - ox) / view.scale + ox,
    y: (py - view.panY - oy) / view.scale + oy,
  };
}

/** Converte ponto do tabuleiro para posição na tela (overlay / FX). */
export function worldToScreen(
  wx: number,
  wy: number,
  w: number,
  h: number,
  view: BattlefieldView
): { x: number; y: number } {
  const { ox, oy } = canvasCenter(w, h);
  return {
    x: (wx - ox) * view.scale + ox + view.panX,
    y: (wy - oy) * view.scale + oy + view.panY,
  };
}

export function applyBattlefieldViewTransform(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  view: BattlefieldView
): void {
  const { ox, oy } = canvasCenter(w, h);
  ctx.translate(view.panX, view.panY);
  ctx.translate(ox, oy);
  ctx.scale(view.scale, view.scale);
  ctx.translate(-ox, -oy);
}

/** Mantém o ponto do mouse fixo ao mudar o zoom. */
export function zoomViewAtPointer(
  view: BattlefieldView,
  px: number,
  py: number,
  w: number,
  h: number,
  nextScale: number
): BattlefieldView {
  const scale = clampBattlefieldScale(nextScale);
  const { ox, oy } = canvasCenter(w, h);
  const wx = (px - view.panX - ox) / view.scale + ox;
  const wy = (py - view.panY - oy) / view.scale + oy;
  return {
    scale,
    panX: px - (wx - ox) * scale - ox,
    panY: py - (wy - oy) * scale - oy,
  };
}
