"use client";

import { useCallback } from "react";
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

const BLOBS: Blob[] = [
  { x: 0.12, y: 0.35, rx: 0.34, ry: 0.22, phase: 0, speed: 0.045, rgb: "72,32,140" },
  { x: 0.42, y: 0.55, rx: 0.38, ry: 0.24, phase: 1.4, speed: 0.032, rgb: "40,18,95" },
  { x: 0.72, y: 0.28, rx: 0.3, ry: 0.2, phase: 2.8, speed: 0.038, rgb: "95,45,160" },
  { x: 0.58, y: 0.72, rx: 0.32, ry: 0.18, phase: 4.1, speed: 0.028, rgb: "55,25,110" },
  { x: 0.22, y: 0.68, rx: 0.26, ry: 0.16, phase: 5.5, speed: 0.05, rgb: "120,60,180" },
];

export default function NevoaRoxa() {
  const draw = useCallback(({ ctx, width: W, height: H, time: t }: CanvasFrame) => {
    ctx.fillStyle = "#0a0614";
    ctx.fillRect(0, 0, W, H);

    for (const b of BLOBS) {
      const x = ((b.x + t * b.speed) % 1.35) - 0.18;
      const pulse = 0.05 + 0.03 * Math.sin(t * 0.9 + b.phase);
      const wobble = Math.sin(t * 0.55 + b.phase) * H * 0.04;
      const cx = x * W;
      const cy = b.y * H + wobble;
      const radius = b.rx * W * 1.15;

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      g.addColorStop(0, `rgba(${b.rgb},${pulse * 0.55})`);
      g.addColorStop(0.35, `rgba(${b.rgb},${pulse * 0.28})`);
      g.addColorStop(0.7, `rgba(${b.rgb},${pulse * 0.08})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, b.rx * W * 1.1, b.ry * H * 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const sweep = (t * 0.08) % 1;
    const sg = ctx.createLinearGradient(0, 0, W, H);
    sg.addColorStop(Math.max(0, sweep - 0.2), "rgba(0,0,0,0)");
    sg.addColorStop(sweep, "rgba(100,60,160,0.04)");
    sg.addColorStop(Math.min(1, sweep + 0.2), "rgba(0,0,0,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);

    drawVignette(ctx, W, H, 0.42);
  }, []);

  const canvasRef = useCanvasAnimation(draw);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
