"use client";

import { useCallback, useMemo } from "react";
import { drawVignette, useCanvasAnimation, type CanvasFrame } from "./canvas-loop";

type Blob = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  phase: number;
  speed: number;
  rgb: string;
};

type SmokeWisp = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rx: number;
  ry: number;
  phase: number;
  rot: number;
  rotSpeed: number;
  opacity: number;
};

const BLOBS: Blob[] = [
  { x: 0.12, y: 0.35, rx: 0.34, ry: 0.22, phase: 0, speed: 0.058, rgb: "72,32,140" },
  { x: 0.42, y: 0.55, rx: 0.38, ry: 0.24, phase: 1.4, speed: 0.042, rgb: "40,18,95" },
  { x: 0.72, y: 0.28, rx: 0.3, ry: 0.2, phase: 2.8, speed: 0.048, rgb: "95,45,160" },
  { x: 0.58, y: 0.72, rx: 0.32, ry: 0.18, phase: 4.1, speed: 0.036, rgb: "55,25,110" },
  { x: 0.22, y: 0.68, rx: 0.26, ry: 0.16, phase: 5.5, speed: 0.062, rgb: "120,60,180" },
];

function spawnSmoke(): SmokeWisp {
  return {
    x: Math.random(),
    y: 0.78 + Math.random() * 0.28,
    vx: (Math.random() - 0.5) * 0.018,
    vy: -0.008 - Math.random() * 0.01,
    rx: 0.1 + Math.random() * 0.16,
    ry: 0.05 + Math.random() * 0.09,
    phase: Math.random() * Math.PI * 2,
    rot: Math.random() * Math.PI,
    rotSpeed: (Math.random() - 0.5) * 0.06,
    opacity: 0.035 + Math.random() * 0.045,
  };
}

function drawSmokeLayer(
  ctx: CanvasRenderingContext2D,
  wisps: SmokeWisp[],
  W: number,
  H: number,
  t: number,
  dt: number,
  blend: GlobalCompositeOperation
): void {
  ctx.save();
  ctx.globalCompositeOperation = blend;

  for (const s of wisps) {
    s.x += (s.vx + Math.sin(t * 0.28 + s.phase) * 0.006) * dt;
    s.y += s.vy * dt;
    s.rot += s.rotSpeed * dt;

    if (s.y < -0.18 || s.x < -0.2 || s.x > 1.2) {
      Object.assign(s, spawnSmoke());
    }

    const swell = 1 + 0.14 * Math.sin(t * 0.38 + s.phase);
    const driftY = Math.sin(t * 0.22 + s.phase * 1.3) * H * 0.018;
    const cx = s.x * W;
    const cy = s.y * H + driftY;
    const rx = s.rx * W * swell;
    const ry = s.ry * H * swell;
    const breathe = 0.75 + 0.25 * Math.sin(t * 0.5 + s.phase);

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry) * 1.15);
    g.addColorStop(0, `rgba(150,110,195,${s.opacity * breathe * 0.55})`);
    g.addColorStop(0.4, `rgba(95,55,145,${s.opacity * breathe * 0.32})`);
    g.addColorStop(0.75, `rgba(55,28,95,${s.opacity * breathe * 0.12})`);
    g.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(s.rot);
    ctx.translate(-cx, -cy);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export default function NevoaRoxa() {
  const smoke = useMemo(
    () =>
      Array.from({ length: 16 }, () => {
        const w = spawnSmoke();
        w.y = Math.random() * 1.05;
        return w;
      }),
    []
  );

  const haze = useMemo(
    () =>
      Array.from({ length: 6 }, () => {
        const w = spawnSmoke();
        w.rx *= 1.6;
        w.ry *= 1.4;
        w.opacity *= 0.65;
        w.vy *= 0.55;
        w.y = Math.random();
        return w;
      }),
    []
  );

  const draw = useCallback(
    ({ ctx, width: W, height: H, time: t, dt }: CanvasFrame) => {
      ctx.fillStyle = "#0a0614";
      ctx.fillRect(0, 0, W, H);

      for (const b of BLOBS) {
        const x = ((b.x + t * b.speed) % 1.35) - 0.18;
        const pulse = 0.07 + 0.045 * Math.sin(t * 0.85 + b.phase);
        const wobble = Math.sin(t * 0.5 + b.phase) * H * 0.055;
        const cx = x * W;
        const cy = b.y * H + wobble;
        const radius = b.rx * W * 1.15;

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        g.addColorStop(0, `rgba(${b.rgb},${pulse * 0.62})`);
        g.addColorStop(0.35, `rgba(${b.rgb},${pulse * 0.34})`);
        g.addColorStop(0.7, `rgba(${b.rgb},${pulse * 0.1})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, cy, b.rx * W * 1.1, b.ry * H * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      drawSmokeLayer(ctx, haze, W, H, t, dt, "screen");
      drawSmokeLayer(ctx, smoke, W, H, t, dt, "lighter");

      const sweep = (t * 0.09) % 1;
      const sg = ctx.createLinearGradient(0, 0, W, H);
      sg.addColorStop(Math.max(0, sweep - 0.2), "rgba(0,0,0,0)");
      sg.addColorStop(sweep, "rgba(100,60,160,0.05)");
      sg.addColorStop(Math.min(1, sweep + 0.2), "rgba(0,0,0,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H);

      drawVignette(ctx, W, H, 0.42);
    },
    [haze, smoke]
  );

  const canvasRef = useCanvasAnimation(draw);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
