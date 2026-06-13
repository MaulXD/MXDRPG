"use client";

import { useCallback, useMemo } from "react";
import { drawVignette, useCanvasAnimation, type CanvasFrame } from "./canvas-loop";

const CELL = 48;

function buildCells(width: number, height: number) {
  const cols = Math.ceil(width / CELL) + 1;
  const rows = Math.ceil(height / CELL) + 1;
  const cells: Array<{ x: number; y: number; seed: number }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ x: c * CELL, y: r * CELL, seed: (r * 883 + c * 421) % 100 });
    }
  }
  return cells;
}

const LIGHTS = [
  { x: 0.5, y: 0.45, radius: 280, phase: 0 },
  { x: 0.18, y: 0.3, radius: 160, phase: 1.6 },
  { x: 0.82, y: 0.7, radius: 150, phase: 3.2 },
];

export default function Pergaminho() {
  const cellsRef = useMemo(() => ({ cells: [] as ReturnType<typeof buildCells>, W: 0, H: 0 }), []);

  const draw = useCallback(({ ctx, width: W, height: H, time: t }: CanvasFrame) => {
    if (W !== cellsRef.W || H !== cellsRef.H) {
      cellsRef.cells = buildCells(W, H);
      cellsRef.W = W;
      cellsRef.H = H;
    }

    ctx.fillStyle = "#14100a";
    ctx.fillRect(0, 0, W, H);

    for (const cl of cellsRef.cells) {
      const shimmer = Math.sin(t * 0.6 + cl.seed * 0.1) * 3;
      const b = 14 + cl.seed * 0.08 + shimmer;
      ctx.fillStyle = `rgb(${b + 6},${Math.floor(b * 0.9)},${Math.floor(b * 0.55)})`;
      ctx.fillRect(cl.x, cl.y, CELL, CELL);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cl.x + 0.5, cl.y + 0.5, CELL - 1, CELL - 1);
    }

    for (const g of LIGHTS) {
      const ox = Math.sin(t * 0.35 + g.phase) * W * 0.04;
      const oy = Math.cos(t * 0.28 + g.phase) * H * 0.03;
      const pulse = 0.12 + 0.08 * Math.sin(t * 0.9 + g.phase);
      const gr = ctx.createRadialGradient(
        g.x * W + ox,
        g.y * H + oy,
        0,
        g.x * W + ox,
        g.y * H + oy,
        g.radius
      );
      gr.addColorStop(0, `rgba(200,140,50,${pulse})`);
      gr.addColorStop(0.45, `rgba(170,100,35,${pulse * 0.35})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    }

    drawVignette(ctx, W, H, 0.46);
  }, [cellsRef]);

  const canvasRef = useCanvasAnimation(draw);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}
