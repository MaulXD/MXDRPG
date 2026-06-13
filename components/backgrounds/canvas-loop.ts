import { useEffect, useRef, type RefObject } from "react";

export type CanvasFrame = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Segundos desde o início. */
  time: number;
  /** Delta em segundos (cap ~50ms). */
  dt: number;
};

/** Vinheta leve — a antiga (0.88) escondia toda a animação. */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  edgeAlpha = 0.48
): void {
  const g = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.12,
    width / 2,
    height / 2,
    height * 0.92
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${edgeAlpha})`);
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

export function useCanvasAnimation(
  draw: (frame: CanvasFrame) => void
): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let time = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 100);
    };
    window.addEventListener("resize", onResize);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;

      drawRef.current({
        ctx,
        width: window.innerWidth,
        height: window.innerHeight,
        time,
        dt,
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return canvasRef;
}
