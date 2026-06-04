import type { PortraitFocus } from "@/lib/media/portrait-focus";
import { DEFAULT_PORTRAIT_FOCUS } from "@/lib/media/portrait-focus";
import type { TokenRingStyle } from "@/lib/vtt/token-colors";

/** Raio do token em relação ao hex */
export const TOKEN_RADIUS_RATIO = 0.48;

export function tokenRadius(hexSize: number): number {
  return hexSize * TOKEN_RADIUS_RATIO;
}

export function drawTokenDropShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.82, radius * 0.9, radius * 0.26, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  ctx.restore();
}

/** Placeholder quando a imagem ainda não carregou */
export function drawTokenPlaceholder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  name: string
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  const base = ctx.createRadialGradient(cx, cy - radius * 0.25, radius * 0.15, cx, cy, radius);
  base.addColorStop(0, "rgba(255,255,255,0.22)");
  base.addColorStop(0.55, color);
  base.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = base;
  ctx.fill();
  ctx.restore();

  const initial = (name.trim()[0] ?? "?").toUpperCase();
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `700 ${Math.round(radius * 1.05)}px Lora, Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 4;
  ctx.fillText(initial, cx, cy + 1);
  ctx.restore();
}

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
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, cx - radius, cy - radius, diameter, diameter);
  ctx.restore();

  drawTokenImageVignette(ctx, cx, cy, radius);

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawTokenImageVignette(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createRadialGradient(cx, cy, radius * 0.25, cx, cy, radius);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.75, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
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
