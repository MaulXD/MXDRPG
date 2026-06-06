import type { CSSProperties } from "react";
import { normalizePortraitFocus, type PortraitFocus } from "@/lib/media/portrait-focus";

export type FocusImgLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Mesma matemática de `drawCover` em image-upload-client.ts */
export function computeFocusImgLayout(
  focus: PortraitFocus,
  frameW: number,
  frameH: number,
  imgW: number,
  imgH: number
): FocusImgLayout {
  const f = normalizePortraitFocus(focus);
  const zoom = f.scale ?? 1;
  const coverScale = Math.max(frameW / imgW, frameH / imgH);
  const scale = coverScale * zoom;
  const width = imgW * scale;
  const height = imgH * scale;
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
