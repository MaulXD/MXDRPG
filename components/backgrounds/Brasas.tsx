"use client";

import { useCallback, useMemo } from "react";
import { drawVignette, useCanvasAnimation, type CanvasFrame } from "./canvas-loop";

type Ember = {
  x: number;
  y: number;
  vy: number;
  vx: number;
  life: number;
  maxLife: number;
  phase: number;
  r: number;
  hot: boolean;
};

function spawnEmber(): Ember {
  return {
    x: Math.random(),
    y: 1.05 + Math.random() * 0.1,
    vy: 0.08 + Math.random() * 0.12,
    vx: (Math.random() - 0.5) * 0.04,
    life: 0.6 + Math.random() * 0.4,
    maxLife: 1,
    phase: Math.random() * Math.PI * 2,
    r: 1.2 + Math.random() * 2.2,
    hot: Math.random() < 0.45,
  };
}

export default function Brasas() {
  const embers = useMemo(
    () => Array.from({ length: 70 }, () => {
      const e = spawnEmber();
      e.y = Math.random();
      return e;
    }),
    []
  );

  const draw = useCallback(({ ctx, width: W, height: H, time: t, dt }: CanvasFrame) => {
    ctx.fillStyle = "#120a04";
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.5, H * 0.85, 0, W * 0.5, H, H * 0.55);
    glow.addColorStop(0, `rgba(200,80,20,${0.18 + 0.06 * Math.sin(t * 1.5)})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    for (const e of embers) {
      e.y -= e.vy * dt;
      e.x += (e.vx + Math.sin(t * 2.2 + e.phase) * 0.025) * dt;
      e.life -= dt * 0.35;

      if (e.life <= 0 || e.y < -0.05) {
        Object.assign(e, spawnEmber());
      }

      const alpha = (e.life / e.maxLife) * 0.9;
      const px = e.x * W;
      const py = e.y * H;

      if (e.hot) {
        const tg = ctx.createRadialGradient(px, py, 0, px, py, e.r * 4);
        tg.addColorStop(0, `rgba(255,140,30,${alpha * 0.5})`);
        tg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = tg;
        ctx.fillRect(px - e.r * 4, py - e.r * 4, e.r * 8, e.r * 8);
        ctx.fillStyle = `rgb(255,${100 + Math.floor(e.life * 100)},20)`;
      } else {
        ctx.fillStyle = `rgba(180,120,80,${alpha * 0.7})`;
      }

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    drawVignette(ctx, W, H, 0.44);
  }, [embers]);

  const canvasRef = useCanvasAnimation(draw);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
