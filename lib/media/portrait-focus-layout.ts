import type { CSSProperties } from "react";
import { normalizePortraitFocus, type PortraitFocus } from "@/lib/media/portrait-focus";

export type FocusImgLayout = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type FocusFitMode = "contain" | "cover";

/**
 * contain: scale 1 = imagem inteira visível (letterbox se preciso).
 * cover: scale 1 = preenche o quadro (recorte se preciso).
 * scale > 1 = zoom a partir desse enquadramento.
 */
export function computeFocusImgLayout(
  focus: PortraitFocus,
  frameW: number,
  frameH: number,
  imgW: number,
  imgH: number,
  fitMode: FocusFitMode = "contain"
): FocusImgLayout {
  const f = normalizePortraitFocus(focus);
  const zoom = Math.max(1, f.scale ?? 1);
  const baseScale =
    fitMode === "cover"
      ? Math.max(frameW / imgW, frameH / imgH)
      : Math.min(frameW / imgW, frameH / imgH);
  const width = imgW * baseScale * zoom;
  const height = imgH * baseScale * zoom;

  const maxPanX = Math.max(0, width - frameW);
  const maxPanY = Math.max(0, height - frameH);

  const left = width <= frameW ? (frameW - width) / 2 : -maxPanX * f.x;
  const top = height <= frameH ? (frameH - height) / 2 : -maxPanY * f.y;

  return { left, top, width, height };
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
