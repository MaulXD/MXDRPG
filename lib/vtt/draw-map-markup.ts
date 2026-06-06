import type { MapMarkup } from "@/lib/vtt/types";
import { markupOpacity } from "@/lib/vtt/map-markup";

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: number
): void {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(ang - 0.45), y2 - size * Math.sin(ang - 0.45));
  ctx.lineTo(x2 - size * Math.cos(ang + 0.45), y2 - size * Math.sin(ang + 0.45));
  ctx.closePath();
  ctx.fill();
}

function drawSingleMarkup(
  ctx: CanvasRenderingContext2D,
  markup: MapMarkup,
  now: number,
  selected: boolean
): void {
  const alpha = markupOpacity(markup, now);
  if (alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = markup.color;
  ctx.fillStyle = markup.color;
  ctx.lineWidth = markup.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const pts = markup.points;
  if (
    markup.kind === "freehand" ||
    markup.kind === "line" ||
    markup.kind === "polygon"
  ) {
    if (pts.length < 2) {
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(pts[0]!.x, pts[0]!.y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y);
    if (markup.kind === "polygon" && pts.length >= 3) ctx.closePath();
    ctx.stroke();
  } else if (markup.kind === "arrow" && pts.length >= 2) {
    const a = pts[0]!;
    const b = pts[1]!;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    drawArrowHead(ctx, a.x, a.y, b.x, b.y, 8 + markup.width * 1.5);
  } else if (markup.kind === "rect" && pts.length >= 2) {
    const a = pts[0]!;
    const b = pts[1]!;
    const w = b.x - a.x;
    const h = b.y - a.y;
    ctx.strokeRect(a.x, a.y, w, h);
  } else if (markup.kind === "circle" && pts.length >= 2) {
    const c = pts[0]!;
    const e = pts[1]!;
    const r = Math.hypot(e.x - c.x, e.y - c.y);
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (markup.kind === "text" && pts[0]) {
    ctx.font = `600 ${12 + markup.width}px var(--font-display, Georgia), serif`;
    ctx.textBaseline = "top";
    ctx.fillText(markup.text?.trim() || "…", pts[0].x, pts[0].y);
  }

  if (selected) {
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "rgba(122, 163, 201, 0.95)";
    ctx.lineWidth = 1.5;
    const bounds = markupBounds(markup);
    if (bounds) {
      ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.w + 8, bounds.h + 8);
    }
  }

  ctx.restore();
}

function markupBounds(markup: MapMarkup): { x: number; y: number; w: number; h: number } | null {
  if (markup.kind === "text" && markup.points[0]) {
    const p = markup.points[0];
    const w = Math.max(40, (markup.text?.length ?? 4) * 8);
    return { x: p.x, y: p.y - 4, w, h: 20 };
  }
  if (markup.kind === "circle" && markup.points.length >= 2) {
    const c = markup.points[0]!;
    const e = markup.points[1]!;
    const r = Math.hypot(e.x - c.x, e.y - c.y);
    return { x: c.x - r, y: c.y - r, w: r * 2, h: r * 2 };
  }
  if (markup.kind === "rect" && markup.points.length >= 2) {
    const a = markup.points[0]!;
    const b = markup.points[1]!;
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      w: Math.abs(b.x - a.x),
      h: Math.abs(b.y - a.y),
    };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of markup.points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (!Number.isFinite(minX)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function drawMapMarkupLayer(
  ctx: CanvasRenderingContext2D,
  markups: MapMarkup[],
  opts?: {
    preview?: MapMarkup | null;
    selectedId?: string | null;
    now?: number;
  }
): void {
  const now = opts?.now ?? Date.now();
  const selectedId = opts?.selectedId ?? null;
  for (const m of markups) {
    drawSingleMarkup(ctx, m, now, m.id === selectedId);
  }
  if (opts?.preview) {
    drawSingleMarkup(ctx, opts.preview, now, false);
  }
}
