import type { Axial } from "@/lib/vtt/hex-math";
import { axialToPixel, hexCorners } from "@/lib/vtt/hex-math";
import { dungeonObjectsOf } from "@/lib/vtt/dungeon-layer";
import type { CanvasLayout } from "@/lib/vtt/draw-battlefield";
import type { BattleScene, DungeonObject } from "@/lib/vtt/types";

const WALL_FILL = "rgba(48, 52, 62, 0.88)";
const WALL_STROKE = "rgba(120, 128, 148, 0.75)";
const OBJECT_FILL = "rgba(92, 68, 42, 0.82)";
const OBJECT_STROKE = "rgba(201, 169, 98, 0.55)";
const PREVIEW_FILL = "rgba(201, 169, 98, 0.22)";
const PREVIEW_STROKE = "rgba(201, 169, 98, 0.65)";
const SELECT_STROKE = "rgba(120, 200, 255, 0.9)";

function drawHexCell(
  ctx: CanvasRenderingContext2D,
  cell: Axial,
  hexSize: number,
  ox: number,
  oy: number,
  fill: string,
  stroke: string,
  lineWidth = 1.5
): void {
  const { x, y } = axialToPixel(cell.q, cell.r, hexSize, ox, oy);
  ctx.beginPath();
  const corners = hexCorners(x, y, hexSize - 2);
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawObjectGlyph(
  ctx: CanvasRenderingContext2D,
  obj: DungeonObject,
  hexSize: number,
  ox: number,
  oy: number
): void {
  const { x, y } = axialToPixel(obj.q, obj.r, hexSize, ox, oy);
  const r = hexSize * 0.22;
  ctx.save();
  ctx.translate(x, y);
  if (obj.kind === "wall") {
    ctx.fillStyle = "rgba(180, 186, 200, 0.35)";
    ctx.fillRect(-r * 1.1, -r * 0.35, r * 2.2, r * 0.7);
    ctx.strokeStyle = "rgba(220, 224, 235, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-r * 1.1, -r * 0.35, r * 2.2, r * 0.7);
  } else {
    ctx.fillStyle = "rgba(201, 169, 98, 0.35)";
    ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.strokeStyle = "rgba(232, 226, 214, 0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
  }
  ctx.restore();
}

export function drawDungeonLayer(
  ctx: CanvasRenderingContext2D,
  scene: BattleScene,
  hexSize: number,
  layout: CanvasLayout,
  opts?: {
    hoverAxial?: Axial | null;
    editorPreviewKind?: "wall" | "object" | null;
    selectedObjectId?: string | null;
    visibleHexSet?: Set<string> | null;
  }
): void {
  const { ox, oy } = layout;
  const objects = dungeonObjectsOf(scene);

  ctx.save();
  for (const obj of objects) {
    const key = `${obj.q},${obj.r}`;
    if (opts?.visibleHexSet && !opts.visibleHexSet.has(key)) continue;

    const fill = obj.kind === "wall" ? WALL_FILL : OBJECT_FILL;
    const stroke =
      obj.id === opts?.selectedObjectId ? SELECT_STROKE : obj.kind === "wall" ? WALL_STROKE : OBJECT_STROKE;
    drawHexCell(ctx, { q: obj.q, r: obj.r }, hexSize, ox, oy, fill, stroke, obj.id === opts?.selectedObjectId ? 2.5 : 1.5);
    drawObjectGlyph(ctx, obj, hexSize, ox, oy);
  }

  if (opts?.hoverAxial && opts.editorPreviewKind) {
    const at = objects.find(
      (o) => o.q === opts.hoverAxial!.q && o.r === opts.hoverAxial!.r
    );
    if (!at) {
      drawHexCell(
        ctx,
        opts.hoverAxial,
        hexSize,
        ox,
        oy,
        PREVIEW_FILL,
        PREVIEW_STROKE,
        2
      );
    }
  }
  ctx.restore();
}
