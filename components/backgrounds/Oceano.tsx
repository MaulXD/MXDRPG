"use client";

import { useCallback } from "react";
import { drawVignette, useCanvasAnimation, type CanvasFrame } from "./canvas-loop";

const WAVES = Array.from({ length: 8 }, (_, i) => ({
  baseY: 0.2 + i * 0.09,
  freq: 0.008 + i * 0.0015,
  phase: i * 0.9,
  speed: 1.2 + i * 0.25,
  amp: 10 + i * 3,
}));

export default function Oceano() {
  const draw = useCallback(({ ctx, width: W, height: H, time: t }: CanvasFrame) => {
    ctx.fillStyle = "#041018";
    ctx.fillRect(0, 0, W, H);

    const dg = ctx.createLinearGradient(0, 0, 0, H);
    dg.addColorStop(0, "rgba(20,60,120,0.35)");
    dg.addColorStop(1, "rgba(4,16,40,0.55)");
    ctx.fillStyle = dg;
    ctx.fillRect(0, 0, W, H);

    WAVES.forEach((w, i) => {
      const alpha = 0.12 + 0.1 * (1 - i / WAVES.length) + 0.06 * Math.sin(t * 0.8 + i);
      ctx.strokeStyle = `rgba(60,140,220,${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 4) {
        const y =
          w.baseY * H +
          Math.sin(x * w.freq + t * w.speed + w.phase) * w.amp +
          Math.sin(x * w.freq * 0.5 - t * 0.6 + w.phase) * (w.amp * 0.4);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    for (let i = 0; i < 6; i++) {
      const fx = ((t * 0.04 + i * 0.17) % 1.2) * W;
      const fy = H * (0.25 + i * 0.1) + Math.sin(t + i) * 20;
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 60);
      fg.addColorStop(0, "rgba(100,180,255,0.18)");
      fg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
    }

    drawVignette(ctx, W, H, 0.45);
  }, []);

  const canvasRef = useCanvasAnimation(draw);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
