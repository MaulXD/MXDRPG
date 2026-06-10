import type { Axial } from "@/lib/vtt/hex-math";
import { axialToPixel, hexCorners, hexDrawRadius } from "@/lib/vtt/hex-math";
import { isHexVisibleToPlayer } from "@/lib/vtt/fog-of-war";
import type { BattlePing } from "@/lib/vtt/types";
import type { BattleScene } from "@/lib/vtt/types";
import type { CanvasLayout } from "@/lib/vtt/draw-battlefield";

export function computeMapImageRect(
  img: HTMLImageElement,
  scene: BattleScene,
  layout: CanvasLayout
): { x: number; y: number; w: number; h: number } {
  const scale = scene.mapImageScale ?? 1;
  const offX = scene.mapImageOffsetX ?? 0;
  const offY = scene.mapImageOffsetY ?? 0;
  const fit =
    Math.max(layout.w / img.naturalWidth, layout.h / img.naturalHeight) * scale;
  const w = img.naturalWidth * fit;
  const h = img.naturalHeight * fit;
  return {
    x: layout.ox - w / 2 + offX,
    y: layout.oy - h / 2 + offY,
    w,
    h,
  };
}

export function drawMapImageLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  scene: BattleScene,
  layout: CanvasLayout
): void {
  const rect = computeMapImageRect(img, scene, layout);
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

export function drawFogLayer(
  ctx: CanvasRenderingContext2D,
  cells: Axial[],
  scene: BattleScene,
  hexSize: number,
  layout: CanvasLayout,
  visibleHexSet: Set<string> | null
): void {
  if (!visibleHexSet || !scene.fogEnabled) return;

  const { ox, oy } = layout;
  ctx.save();
  for (const cell of cells) {
    if (isHexVisibleToPlayer(scene, cell.q, cell.r, visibleHexSet)) {
      continue;
    }
    const { x, y } = axialToPixel(cell.q, cell.r, hexSize, ox, oy);
    ctx.beginPath();
    const corners = hexCorners(x, y, hexDrawRadius(hexSize));
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.fillStyle = "rgba(4, 6, 10, 0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(20, 24, 32, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPingLayer(
  ctx: CanvasRenderingContext2D,
  pings: BattlePing[],
  hexSize: number,
  layout: CanvasLayout
): void {
  const now = Date.now();
  const { ox, oy } = layout;

  for (const ping of pings) {
    const age = (now - ping.at) / 1000;
    if (age > 5.5) continue;
    const pulse = 1 - age / 5.5;
    const { x, y } = axialToPixel(ping.q, ping.r, hexSize, ox, oy);
    const r = 10 + (1 - pulse) * 18;

    ctx.save();
    ctx.strokeStyle = ping.color;
    ctx.globalAlpha = 0.35 + pulse * 0.55;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 6, y);
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
    ctx.restore();
  }
}
