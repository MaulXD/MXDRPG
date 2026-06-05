import type { TargetCombatPreview } from "@/lib/combat/hit-chance";

/** 0.8 = anéis 20% mais lentos que a velocidade base. */
const TOKEN_RING_ANIM_SPEED = 0.8;

function ringAnimTime(timeSec: number): number {
  return timeSec * TOKEN_RING_ANIM_SPEED;
}

/** Anel dourado girando — turno ativo no hex. */
export function drawTurnActiveIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  timeSec: number
): void {
  const t = ringAnimTime(timeSec);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.8);
  const ringR = r + 8;

  ctx.save();

  ctx.setLineDash([10, 7]);
  ctx.lineDashOffset = -t * 42;
  ctx.beginPath();
  ctx.arc(x, y, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(201, 169, 98, ${0.72 + pulse * 0.22})`;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.setLineDash([4, 11]);
  ctx.lineDashOffset = t * 28;
  ctx.beginPath();
  ctx.arc(x, y, ringR - 2, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 220, 140, ${0.38 + pulse * 0.15})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();
}

/** Alvos válidos de ataque (modo alvo) — pulso vermelho suave. */
export function drawAttackableHint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  timeSec: number
): void {
  const t = ringAnimTime(timeSec);
  const pulse = 0.5 + 0.5 * Math.sin(t * 3.5);
  ctx.save();
  ctx.setLineDash([4, 8]);
  ctx.lineDashOffset = t * 28;
  ctx.beginPath();
  ctx.arc(x, y, r + 9 + pulse * 4, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(196, 68, 68, ${0.35 + pulse * 0.3})`;
  ctx.lineWidth = 1.75;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/** Rótulo de chance / vantagem sobre o alvo mirado. */
export function drawTargetCombatPreviewLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  preview: TargetCombatPreview
): void {
  const main =
    preview.kind === "save"
      ? `${preview.saveFailPercent ?? 0}% falha`
      : `${preview.hitChancePercent ?? 0}% acerto`;
  const sub = preview.rollModeText || (preview.kind === "save" ? `CD ${preview.dc}` : `CA ${preview.ac}`);

  const by = y - r - 34;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const mainFont = "700 11px Source Sans 3, Segoe UI, sans-serif";
  const subFont = "600 9px Source Sans 3, Segoe UI, sans-serif";
  ctx.font = mainFont;
  const tw = Math.max(ctx.measureText(main).width, ctx.measureText(sub).width) + 16;
  const bh = preview.rollModeText ? 30 : 22;
  const bx = x - tw / 2;
  const byBox = by - bh / 2;

  const border =
    preview.rollMode === "advantage"
      ? "rgba(88, 140, 76, 0.95)"
      : preview.rollMode === "disadvantage"
        ? "rgba(200, 120, 48, 0.95)"
        : "rgba(0, 0, 0, 0.88)";

  ctx.fillStyle = "rgba(8, 8, 6, 0.92)";
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  ctx.roundRect(bx, byBox, tw, bh, 4);
  ctx.fill();
  ctx.stroke();

  ctx.font = mainFont;
  ctx.fillStyle =
    preview.rollMode === "advantage"
      ? "rgb(136, 196, 124)"
      : preview.rollMode === "disadvantage"
        ? "rgb(232, 168, 88)"
        : "rgb(232, 226, 214)";
  ctx.fillText(main, x, byBox + (preview.rollModeText ? 9 : 11));

  if (preview.rollModeText) {
    ctx.font = subFont;
    ctx.fillStyle =
      preview.rollMode === "advantage"
        ? "rgb(120, 180, 108)"
        : preview.rollMode === "disadvantage"
          ? "rgb(220, 150, 70)"
          : "rgba(232, 226, 214, 0.75)";
    ctx.fillText(preview.rollModeText, x, byBox + 21);
  } else {
    ctx.font = subFont;
    ctx.fillStyle = "rgba(232, 226, 214, 0.7)";
    ctx.fillText(sub, x, byBox + 18);
  }

  ctx.restore();
}

/** Alvo sob o cursor ao mirar ataque — retículo + pulso forte. */
export function drawAttackTargetFocus(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  timeSec: number
): void {
  const t = ringAnimTime(timeSec);
  const pulse = 0.5 + 0.5 * Math.sin(t * 5.5);
  const expand = (t % 1.1) / 1.1;

  ctx.save();
  ctx.strokeStyle = `rgba(255, 90, 80, ${0.75 + pulse * 0.25})`;
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  const gap = r + 5;
  const tip = r + 20 + pulse * 4;
  const arms: [number, number, number, number][] = [
    [x, y - tip, x, y - gap],
    [x, y + gap, x, y + tip],
    [x - tip, y, x - gap, y],
    [x + gap, y, x + tip, y],
  ];
  for (const seg of arms) {
    ctx.beginPath();
    ctx.moveTo(seg[0], seg[1]);
    ctx.lineTo(seg[2], seg[3]);
    ctx.stroke();
  }

  const corner = r + 14 + pulse * 5;
  const len = 9;
  const brackets: [number, number, number, number][] = [
    [x - corner, y - corner, 1, 1],
    [x + corner, y - corner, -1, 1],
    [x - corner, y + corner, 1, -1],
    [x + corner, y + corner, -1, -1],
  ];
  ctx.lineWidth = 2;
  for (const [bx, by, sx, sy] of brackets) {
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + sx * len, by);
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by + sy * len);
    ctx.stroke();
  }

  const ringR = r + 8 + expand * 14;
  ctx.beginPath();
  ctx.arc(x, y, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 60, 50, ${(1 - expand) * 0.65})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, r + 6 + pulse * 3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 120, 100, 0.9)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}
