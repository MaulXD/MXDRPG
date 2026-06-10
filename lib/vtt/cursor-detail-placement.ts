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
  const fitsLeft = rect.left - AVATAR_GAP - AVATAR_PANEL_MAX_W >= DETAIL_MARGIN;
  if (fitsLeft) {
    return { left: rect.left - AVATAR_GAP, top: rect.top, flipLeft: true };
  }
  return { left: rect.right + AVATAR_GAP, top: rect.top, flipLeft: false };
}
