import { axialDistance } from "@/lib/vtt/grid-math";
import { cellsToMeters } from "@/lib/vtt/movement";
import type { MeasurePreview } from "@/lib/vtt/map-toolbar";

export function drawMeasureLayer(
  ctx: CanvasRenderingContext2D,
  measure: MeasurePreview | null | undefined
): void {
  if (!measure) return;

  const cellDist = axialDistance(measure.startAxial, measure.endAxial);
  const meters = cellsToMeters(cellDist);
  const label = `${cellDist} cél. · ${meters} m`;

  ctx.save();
  ctx.strokeStyle = "#f1c40f";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(measure.start.x, measure.start.y);
  ctx.lineTo(measure.end.x, measure.end.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#f1c40f";
  for (const p of [measure.start, measure.end]) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const mx = (measure.start.x + measure.end.x) / 2;
  const my = (measure.start.y + measure.end.y) / 2;
  ctx.font = "600 12px var(--font-body, system-ui), sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = "rgba(8, 12, 18, 0.92)";
  ctx.strokeStyle = "rgba(241, 196, 15, 0.55)";
  ctx.lineWidth = 1;
  const padX = 8;
  const padY = 5;
  const boxW = tw + padX * 2;
  const boxH = 18;
  ctx.fillRect(mx - boxW / 2, my - boxH / 2, boxW, boxH);
  ctx.strokeRect(mx - boxW / 2, my - boxH / 2, boxW, boxH);
  ctx.fillStyle = "#f1c40f";
  ctx.fillText(label, mx, my);
  ctx.restore();
}
