const DETAIL_GAP = 14;
const DETAIL_MARGIN = 10;
const DETAIL_MAX_W = 420;

export function computeCursorDetailPlacement(pointer: { x: number; y: number }): {
  left: number;
  top: number;
  flipLeft: boolean;
} {
  const panelW = Math.min(DETAIL_MAX_W, window.innerWidth * 0.94);
  const flipLeft = pointer.x + DETAIL_GAP + panelW > window.innerWidth - DETAIL_MARGIN;
  return {
    left: flipLeft ? pointer.x - DETAIL_GAP : pointer.x + DETAIL_GAP,
    top: pointer.y,
    flipLeft,
  };
}
