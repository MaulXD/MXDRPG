"use client";

import { useCallback, useMemo } from "react";
import { drawVignette, useCanvasAnimation, type CanvasFrame } from "./canvas-loop";

const PALETTE = ["184,146,46", "140,100,200", "80,120,180"];

type Star = {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  rgb: string;
  orbit: number;
  driftX: number;
  driftY: number;
};

export default function VoidArcano() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 80 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.8 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.2,
        rgb: PALETTE[Math.floor(Math.random() * PALETTE.length)]!,
        orbit: 8 + Math.random() * 20,
        driftX: (Math.random() - 0.5) * 0.02,
        driftY: (Math.random() - 0.5) * 0.015,
      })),
    []
  );

  const draw = useCallback(({ ctx, width: W, height: H, time: t, dt }: CanvasFrame) => {
    ctx.fillStyle = "#06060e";
    ctx.fillRect(0, 0, W, H);

    const core = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.45);
    core.addColorStop(0, `rgba(60,30,120,${0.15 + 0.06 * Math.sin(t * 0.7)})`);
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      s.x += s.driftX * dt;
      s.y += s.driftY * dt;
      if (s.x < 0) s.x = 1;
      if (s.x > 1) s.x = 0;
      if (s.y < 0) s.y = 1;
      if (s.y > 1) s.y = 0;

      const ox = Math.sin(t * s.speed + s.phase) * s.orbit;
      const oy = Math.cos(t * s.speed * 0.8 + s.phase) * s.orbit;
      const px = s.x * W + ox;
      const py = s.y * H + oy;
      const alpha = 0.35 + 0.45 * Math.sin(t * s.speed + s.phase);

      const glow = ctx.createRadialGradient(px, py, 0, px, py, s.r * 5);
      glow.addColorStop(0, `rgba(${s.rgb},${alpha * 0.45})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(px - s.r * 5, py - s.r * 5, s.r * 10, s.r * 10);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgb(${s.rgb})`;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawVignette(ctx, W, H, 0.4);
  }, [stars]);

  const canvasRef = useCanvasAnimation(draw);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
