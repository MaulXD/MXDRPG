/** Indicador discreto de turno ativo (sem animação / glow). */
export function drawTurnActiveIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r + 5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(201, 169, 98, 0.85)";
  ctx.lineWidth = 2;
  ctx.stroke();
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
  const pulse = 0.5 + 0.5 * Math.sin(timeSec * 3.5);
  ctx.save();
  ctx.setLineDash([4, 8]);
  ctx.lineDashOffset = timeSec * 28;
  ctx.beginPath();
  ctx.arc(x, y, r + 9 + pulse * 4, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(196, 68, 68, ${0.35 + pulse * 0.3})`;
  ctx.lineWidth = 1.75;
  ctx.stroke();
  ctx.setLineDash([]);
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
  const pulse = 0.5 + 0.5 * Math.sin(timeSec * 5.5);
  const expand = (timeSec % 1.1) / 1.1;

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
