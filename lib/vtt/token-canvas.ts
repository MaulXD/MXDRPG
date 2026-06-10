import { DEFAULT_PORTRAIT_FOCUS, normalizePortraitFocus, type PortraitFocus } from "@/lib/media/portrait-focus";
import type { CreatureSize } from "@/lib/vtt/creature-size";
import { TOKEN_RADIUS_RATIO, tokenDrawRadius } from "@/lib/vtt/creature-size";
import type { TokenRingStyle } from "@/lib/vtt/token-colors";

export { TOKEN_RADIUS_RATIO };

export function tokenRadius(hexSize: number, size: CreatureSize = "medium"): number {
  return tokenDrawRadius(hexSize, size);
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
  ctx.fillStyle = color;
  ctx.fill();

  const shade = ctx.createRadialGradient(cx, cy - radius * 0.2, radius * 0.05, cx, cy, radius);
  shade.addColorStop(0, "rgba(255,255,255,0.14)");
  shade.addColorStop(0.45, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = shade;
  ctx.fill();
  ctx.restore();

  const initial = (name.trim()[0] ?? "?").toUpperCase();
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `700 ${Math.round(radius * 1.05)}px Lora, Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initial, cx, cy + 1);
  ctx.restore();
}

/** Desenha imagem em círculo — scale 1 = preenche o círculo; >1 = zoom com pan */
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

  const f = normalizePortraitFocus(focus);
  const diameter = radius * 2;
  const zoom = Math.max(1, f.scale ?? 1);
  const coverScale = Math.max(diameter / iw, diameter / ih);
  const scale = coverScale * zoom;
  const sw = diameter / scale;
  const sh = diameter / scale;
  const sx = Math.max(0, Math.min(iw - sw, (iw - sw) * f.x));
  const sy = Math.max(0, Math.min(ih - sh, (ih - sh) * f.y));

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, cx - radius, cy - radius, diameter, diameter);
  ctx.restore();
}

function strokeCircleRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawTokenIdentityRings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseRadius: number,
  style: TokenRingStyle,
  opts?: { skipOutermostRing?: boolean; outerRingOffset?: number }
): void {
  /** Inset: offset menor = anel mais externo (perto da borda do retrato). */
  const outerInset =
    opts?.outerRingOffset ?? Math.min(...style.rings.map((r) => r.radiusOffset));
  ctx.save();
  ctx.lineJoin = "round";
  for (const ring of style.rings) {
    if (opts?.skipOutermostRing && ring.radiusOffset <= outerInset) continue;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.width;
    strokeCircleRing(ctx, cx, cy, baseRadius - ring.radiusOffset);
  }
  ctx.restore();
}
