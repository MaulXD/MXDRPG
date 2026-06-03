import type { PortraitFocus } from "@/lib/media/portrait-focus";
import { DEFAULT_PORTRAIT_FOCUS } from "@/lib/media/portrait-focus";
import type { TokenRingStyle } from "@/lib/vtt/token-colors";

/** Desenha imagem em círculo com crop “cover” no ponto focal */
export function drawCircularTokenImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number,
  focus: PortraitFocus = DEFAULT_PORTRAIT_FOCUS
): void {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (iw <= 0 || ih <= 0) return;

  const diameter = radius * 2;
  const scale = Math.max(diameter / iw, diameter / ih);
  const sw = diameter / scale;
  const sh = diameter / scale;
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * focus.x));
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * focus.y));

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, cx - radius, cy - radius, diameter, diameter);
  ctx.restore();
}

export function drawTokenIdentityRings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  style: TokenRingStyle
): void {
  for (const ring of style.rings) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius + ring.radiusOffset, 0, Math.PI * 2);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.width;
    ctx.stroke();
  }
}
