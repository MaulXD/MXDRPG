import { strokeEffectIcon } from "@/lib/vtt/token-effect-icons";
import type { TokenEffectChip } from "@/lib/vtt/token-effects";
import { listTokenEffectChips } from "@/lib/vtt/token-effects";
import type { BattleToken } from "@/lib/vtt/types";

function drawRemainingBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string
): void {
  const bw = Math.max(13, text.length * 5.5 + 5);
  const bh = 10;
  const bx = cx + 5;
  const by = cy + 6;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 3);
  } else {
    ctx.rect(bx - bw / 2, by - bh / 2, bw, bh);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe8a8";
  ctx.font = "bold 7px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx, by + 0.5);
  ctx.restore();
}

function drawChipPill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  chip: TokenEffectChip
): void {
  const size = 18;
  const x = cx - size / 2;
  const y = cy - size / 2;
  const r = 4;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = chip.bg;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + size - r, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + r);
  ctx.lineTo(x + size, y + size - r);
  ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
  ctx.lineTo(x + r, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = chip.kind === "buff" ? "rgba(120,200,255,0.55)" : "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  strokeEffectIcon(ctx, cx, cy, 12, chip.icon, chip.color, 2);

  if (chip.remaining) {
    drawRemainingBadge(ctx, cx, cy, chip.remaining);
  }
}

/** Pilha de chips à direita do token no hex. */
export function drawTokenEffectBadges(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tokenRadius: number,
  token: BattleToken,
  max = 6
): void {
  const chips = listTokenEffectChips(token).filter((c) => c.id !== "morto");
  if (chips.length === 0) return;

  const shown = chips.slice(0, max);
  const stackX = x + tokenRadius + 12;
  const step = 22;
  const startY = y - ((shown.length - 1) * step) / 2;

  ctx.save();
  for (let i = 0; i < shown.length; i++) {
    drawChipPill(ctx, stackX, startY + i * step, shown[i]);
  }
  if (chips.length > max) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.font = "bold 7px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(`+${chips.length - max}`, stackX, startY + shown.length * step + 4);
  }
  ctx.restore();
}
