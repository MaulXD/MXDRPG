"use client";

import { useCallback, useMemo } from "react";
import { drawVignette, useCanvasAnimation, type CanvasFrame } from "./canvas-loop";

const CHARS = "ᚠᚢᚦᚨᚱᚲᚷᚹᚾᛁᛈᛉᛊᛏᛒᛖᛗᛚᛟᛞ";

export default function Runas() {
  const runes = useMemo(
    () =>
      Array.from({ length: 32 }, () => ({
        x: Math.random(),
        y: Math.random(),
        c: CHARS[Math.floor(Math.random() * CHARS.length)]!,
        size: 16 + Math.random() * 22,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.8,
        drift: (Math.random() - 0.5) * 0.03,
        rise: 0.012 + Math.random() * 0.02,
      })),
    []
  );

  const draw = useCallback(({ ctx, width: W, height: H, time: t, dt }: CanvasFrame) => {
    ctx.fillStyle = "#0a0812";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const r of runes) {
      r.y -= r.rise * dt;
      r.x += r.drift * dt;
      if (r.y < -0.05) {
        r.y = 1.05;
        r.x = Math.random();
      }
      if (r.x < -0.05) r.x = 1.05;
      if (r.x > 1.05) r.x = -0.05;

      const alpha = 0.15 + 0.25 * Math.sin(t * r.speed + r.phase);
      const scale = 1 + 0.08 * Math.sin(t * r.speed * 0.7 + r.phase);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#c8a060";
      ctx.font = `${r.size * scale}px Cinzel, serif`;
      ctx.fillText(r.c, r.x * W, r.y * H);
    }
    ctx.globalAlpha = 1;

    drawVignette(ctx, W, H, 0.42);
  }, [runes]);

  const canvasRef = useCanvasAnimation(draw);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
