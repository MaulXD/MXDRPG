"use client";

import { useCallback } from "react";
import { drawVignette, useCanvasAnimation, type CanvasFrame } from "./canvas-loop";

export default function Oceano() {
  const draw = useCallback(({ ctx, width: W, height: H, time: t }: CanvasFrame) => {
    ctx.fillStyle = "#020610";
    ctx.fillRect(0, 0, W, H);

    const dg = ctx.createLinearGradient(0, 0, 0, H);
    dg.addColorStop(0, "rgba(8,28,58,0.55)");
    dg.addColorStop(0.5, "rgba(4,14,32,0.72)");
    dg.addColorStop(1, "rgba(2,8,20,0.88)");
    ctx.fillStyle = dg;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 5; i++) {
      const fx = ((t * 0.04 + i * 0.2) % 1.2) * W;
      const fy = H * (0.2 + i * 0.12) + Math.sin(t * 0.7 + i) * 16;
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 72);
      fg.addColorStop(0, "rgba(30,70,120,0.12)");
      fg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
    }

    drawVignette(ctx, W, H, 0.48);
  }, []);

  const canvasRef = useCanvasAnimation(draw);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
