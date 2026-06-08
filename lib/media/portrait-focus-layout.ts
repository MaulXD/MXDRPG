import type { CSSProperties } from "react";
import { normalizePortraitFocus, type PortraitFocus } from "@/lib/media/portrait-focus";

export type FocusImgLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Mesma matemática de `drawCover` em image-upload-client.ts — sempre cobre o frame inteiro. */
export function computeFocusImgLayout(
  focus: PortraitFocus,
  frameW: number,
  frameH: number,
  imgW: number,
  imgH: number
): FocusImgLayout {
  const f = normalizePortraitFocus(focus);
  const zoom = Math.max(1, f.scale ?? 1);
  const coverScale = Math.max(frameW / imgW, frameH / imgH);
  let scale = coverScale * zoom;
  let width = imgW * scale;
  let height = imgH * scale;

  // Garante cover mesmo com zoom legado ou arredondamento
  const boost = Math.max(1, frameW / width, frameH / height);
  if (boost > 1) {
    width *= boost;
    height *= boost;
  }

  const maxPanX = Math.max(0, width - frameW);
  const maxPanY = Math.max(0, height - frameH);
  return {
    left: -maxPanX * f.x,
    top: -maxPanY * f.y,
    width,
    height,
  };
}

export function focusLayoutToImgStyle(layout: FocusImgLayout): CSSProperties {
  return {
    position: "absolute",
    left: layout.left,
    top: layout.top,
    width: layout.width,
    height: layout.height,
    maxWidth: "none",
    margin: 0,
    transform: "none",
    objectFit: "fill",
  };
}
