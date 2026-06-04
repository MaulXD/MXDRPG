import type { Axial } from "@/lib/vtt/hex-math";

const DEFAULT_MS_PER_HEX = 160;

export type TokenAnimPosition = {
  q: number;
  r: number;
  axial: Axial;
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpAxial(a: Axial, b: Axial, t: number): TokenAnimPosition {
  const q = a.q + (b.q - a.q) * t;
  const r = a.r + (b.r - a.r) * t;
  return {
    q,
    r,
    axial: { q: Math.round(q), r: Math.round(r) },
  };
}

/** Anima o token ao longo do caminho com interpolação suave (requestAnimationFrame). */
export async function animateTokenAlongPath(
  path: Axial[],
  onStep: (pos: TokenAnimPosition) => void,
  msPerHex = DEFAULT_MS_PER_HEX
): Promise<void> {
  if (path.length === 0) return;

  onStep({ q: path[0].q, r: path[0].r, axial: path[0] });
  if (path.length === 1) return;

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const duration = Math.max(80, msPerHex);
    const start = performance.now();

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const raw = Math.min(1, (now - start) / duration);
        const t = easeInOutCubic(raw);
        onStep(lerpAxial(from, to, t));
        if (raw >= 1) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  const end = path[path.length - 1];
  onStep({ q: end.q, r: end.r, axial: end });
}
