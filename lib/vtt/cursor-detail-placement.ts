const DETAIL_GAP = 14;
const DETAIL_MARGIN = 10;
const DETAIL_MAX_W = 420;

const AVATAR_PANEL_MAX_W = 240;
const AVATAR_GAP = 10;

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

/** Painel de perfil na lista online — à esquerda do avatar, alinhado ao topo. */
export function computeAvatarAnchorPlacement(rect: DOMRect): {
  left: number;
  top: number;
  flipLeft: boolean;
} {
  const panelH = 120;
  const fitsLeft = rect.left - AVATAR_GAP - AVATAR_PANEL_MAX_W >= DETAIL_MARGIN;
  const flipLeft = fitsLeft;
  const left = flipLeft ? rect.left - AVATAR_GAP : rect.right + AVATAR_GAP;
  let top = rect.top;
  top = Math.max(
    DETAIL_MARGIN,
    Math.min(top, window.innerHeight - panelH - DETAIL_MARGIN)
  );
  return { left, top, flipLeft };
}
