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
  const ringR = r + 1.25;

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
  ctx.arc(x, y, r + 3 + pulse * 2, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(196, 68, 68, ${0.35 + pulse * 0.3})`;
  ctx.lineWidth = 1.75;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

type PreviewLine = { text: string; font: string; color: string };

/** Painel de chance / vantagem acima do token mirado. */
export function drawTargetCombatPreviewLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  preview: TargetCombatPreview
): void {
  const main =
    preview.kind === "save"
      ? `${preview.saveFailPercent ?? 0}% falha no teste`
      : `${preview.hitChancePercent ?? 0}% acerto`;
  const detail =
    preview.kind === "save"
      ? `CD ${preview.dc ?? "?"}`
      : `CA ${preview.ac}`;
  const modeLine = preview.rollModeText?.trim() || null;

  const accent =
    preview.rollMode === "advantage"
      ? "rgb(136, 196, 124)"
      : preview.rollMode === "disadvantage"
        ? "rgb(232, 168, 88)"
        : "rgb(232, 226, 214)";

  const accentBorder =
    preview.rollMode === "advantage"
      ? "rgba(136, 196, 124, 0.72)"
      : preview.rollMode === "disadvantage"
        ? "rgba(232, 168, 88, 0.72)"
        : "rgba(196, 68, 68, 0.65)";

  const lines: PreviewLine[] = [
    { text: main, font: "700 11px Source Sans 3, Segoe UI, sans-serif", color: accent },
  ];
  if (modeLine) {
    lines.push({
      text: modeLine,
      font: "600 9px Source Sans 3, Segoe UI, sans-serif",
      color:
        preview.rollMode === "advantage"
          ? "rgb(120, 180, 108)"
          : preview.rollMode === "disadvantage"
            ? "rgb(220, 150, 70)"
            : "rgba(232, 226, 214, 0.88)",
    });
  }
  lines.push({
    text: detail,
    font: "600 10px Source Sans 3, Segoe UI, sans-serif",
    color: "rgba(232, 226, 214, 0.92)",
  });

  const padX = 10;
  const padY = 6;
  const lineH = 13;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  let maxW = 0;
  for (const line of lines) {
    ctx.font = line.font;
    maxW = Math.max(maxW, ctx.measureText(line.text).width);
  }

  const boxW = maxW + padX * 2;
  const boxH = padY * 2 + lines.length * lineH;
  const boxX = x - boxW / 2;
  const gap = 6;
  const boxY = y - r - gap - boxH;

  ctx.fillStyle = "rgba(8, 10, 12, 0.88)";
  ctx.strokeStyle = accentBorder;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 6);
  ctx.fill();
  ctx.stroke();

  let textY = boxY + padY;
  for (const line of lines) {
    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, x, textY);
    textY += lineH;
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
