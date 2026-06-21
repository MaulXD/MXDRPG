"use client";

import { type CSSProperties, useEffect, useState } from "react";
import "./combat-mode-transition.css";

export type CombatModeTransitionPhase = "in" | "out";

type Props = {
  phase: CombatModeTransitionPhase;
};

const EMBERS: Array<{ left: number; size: number; dur: number; delay: number; dx: number }> = [
  { left:  5, size: 4, dur: 1.80, delay: 0.30, dx: -10 },
  { left: 12, size: 3, dur: 2.10, delay: 0.50, dx:  14 },
  { left: 20, size: 4, dur: 1.60, delay: 0.15, dx:  -6 },
  { left: 28, size: 5, dur: 2.30, delay: 0.70, dx:  10 },
  { left: 35, size: 4, dur: 1.90, delay: 0.40, dx: -14 },
  { left: 42, size: 3, dur: 1.70, delay: 0.20, dx:   8 },
  { left: 50, size: 4, dur: 2.00, delay: 0.60, dx:  -4 },
  { left: 58, size: 5, dur: 1.85, delay: 0.35, dx:  12 },
  { left: 65, size: 4, dur: 2.20, delay: 0.55, dx: -10 },
  { left: 73, size: 3, dur: 1.65, delay: 0.25, dx:   6 },
  { left: 80, size: 4, dur: 2.10, delay: 0.45, dx: -12 },
  { left: 88, size: 4, dur: 1.75, delay: 0.10, dx:  10 },
  { left: 93, size: 3, dur: 2.00, delay: 0.65, dx:  -8 },
  { left: 15, size: 3, dur: 1.90, delay: 0.80, dx:   6 },
  { left: 45, size: 4, dur: 2.15, delay: 0.90, dx: -14 },
  { left: 62, size: 3, dur: 1.70, delay: 0.75, dx:  10 },
  { left: 78, size: 4, dur: 2.05, delay: 0.85, dx:  -6 },
  { left: 32, size: 5, dur: 1.95, delay: 0.95, dx:   8 },
];

export function CombatModeTransition({ phase }: Props) {
  const [playing, setPlaying] = useState(false);
  const isIn = phase === "in";

  useEffect(() => {
    setPlaying(false);
    const raf = requestAnimationFrame(() => setPlaying(true));
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <div
      className={[
        "cmt-overlay",
        isIn ? "cmt--combat" : "cmt--adventure",
        playing ? "cmt-overlay--playing" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-label={isIn ? "Combate ativado" : "Modo aventura ativado"}
    >
      <div className="cmt-overlay__bg" aria-hidden />

      {isIn
        ? EMBERS.map((e, i) => (
            <span
              key={i}
              className="cmt-ember"
              style={
                {
                  left: `${e.left}%`,
                  width: `${e.size}px`,
                  height: `${e.size}px`,
                  animationDuration: `${e.dur}s`,
                  animationDelay: `${e.delay}s`,
                  "--cmt-ember-dx": `${e.dx}px`,
                } as CSSProperties
              }
              aria-hidden
            />
          ))
        : null}

      <div className="cmt-overlay__content">
        <div className="cmt-overlay__label">
          {isIn ? "Combate Ativado" : "Modo Aventura"}
        </div>
      </div>
    </div>
  );
}
