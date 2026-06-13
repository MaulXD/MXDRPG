"use client";

import { useCallback } from "react";
import { drawVignette, useCanvasAnimation, type CanvasFrame } from "./canvas-loop";

const CELL = 40;

export default function GridTatico() {
  const draw = useCallback(({ ctx, width: W, height: H, time: t }: CanvasFrame) => {
    const offsetX = (t * 18) % CELL;
    const offsetY = (t * 12) % CELL;

    ctx.fillStyle = "#0c1018";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(184,146,46,0.14)";
    ctx.lineWidth = 1;
    for (let x = -CELL + offsetX; x < W + CELL; x += CELL) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = -CELL + offsetY; y < H + CELL; y += CELL) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const pulse = 0.14 + 0.08 * Math.sin(t * 1.2);
    const pr = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.55);
    pr.addColorStop(0, `rgba(184,146,46,${pulse})`);
    pr.addColorStop(0.5, `rgba(60,100,140,${pulse * 0.4})`);
    pr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = pr;
    ctx.fillRect(0, 0, W, H);

    for (let x = CELL; x < W; x += CELL * 3) {
      for (let y = CELL; y < H; y += CELL * 3) {
        const a = 0.25 + 0.35 * Math.sin(t * 1.8 + x * 0.02 + y * 0.015);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#b8922e";
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
    ctx.globalAlpha = 1;

    const scanY = ((t * 90) % (H + 80)) - 40;
    const scan = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    scan.addColorStop(0, "rgba(0,0,0,0)");
    scan.addColorStop(0.5, "rgba(184,146,46,0.1)");
    scan.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = scan;
    ctx.fillRect(0, 0, W, H);

    drawVignette(ctx, W, H, 0.4);
  }, []);

  const canvasRef = useCanvasAnimation(draw);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
