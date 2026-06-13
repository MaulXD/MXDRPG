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

    for (let x = CELL; x < W; x += CELL * 3) {
      for (let y = CELL; y < H; y += CELL * 3) {
        const a = 0.25 + 0.35 * Math.sin(t * 1.8 + x * 0.02 + y * 0.015);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#b8922e";
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
    ctx.globalAlpha = 1;

    drawVignette(ctx, W, H, 0.4);
  }, []);

  const canvasRef = useCanvasAnimation(draw);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
