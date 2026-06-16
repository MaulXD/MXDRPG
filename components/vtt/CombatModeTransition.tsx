"use client";

import { useEffect, useId, useState } from "react";
import { CombatModeSword } from "@/components/vtt/CombatModeSword";
import "./combat-mode-transition.css";

export type CombatModeTransitionPhase = "in" | "out";

type Props = {
  phase: CombatModeTransitionPhase;
};

export function CombatModeTransition({ phase }: Props) {
  const uid = useId().replace(/:/g, "");
  const [playing, setPlaying] = useState(false);
  const isIn = phase === "in";

  useEffect(() => {
    setPlaying(false);
    const raf = requestAnimationFrame(() => setPlaying(true));
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  const variantClass = isIn ? "cmt--in-clash" : "cmt--out-adventure";

  return (
    <div
      className={[
        "cmt-overlay",
        variantClass,
        playing ? "cmt-overlay--playing" : "",
        !isIn ? "cmt-overlay--exit" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-label={isIn ? "Modo combate ativado" : "Modo aventura ativado"}
    >
      <div className="cmt-overlay__vignette" aria-hidden />
      {isIn ? <div className="cmt-overlay__dim" aria-hidden /> : null}
      {!isIn ? <div className="cmt-adventure__mist" aria-hidden /> : null}
      {!isIn ? <div className="cmt-adventure__warmth" aria-hidden /> : null}

      {isIn ? (
        <>
          <div className="cmt-overlay__flash" aria-hidden />
          <div className="cmt-overlay__content">
            <div className="cmt-swords">
              <span className="cmt-clash-point" aria-hidden />
              <div className="cmt-sword cmt-sword--a">
                <CombatModeSword idPrefix={`${uid}-a`} />
              </div>
              <div className="cmt-sword cmt-sword--b">
                <CombatModeSword idPrefix={`${uid}-b`} />
              </div>
            </div>
            <div className="cmt-overlay__label">Modo Combate</div>
            <div className="cmt-overlay__sub">Iniciativa e PA ativos</div>
          </div>
        </>
      ) : (
        <div className="cmt-overlay__content cmt-overlay__content--adventure">
          <div className="cmt-adventure__compass" aria-hidden>
            <svg viewBox="0 0 64 64" width="72" height="72" role="presentation">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
              <circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.85" />
              <path d="M32 8 L35 26 L32 32 L29 26 Z" fill="currentColor" opacity="0.9" />
              <path d="M32 56 L29 38 L32 32 L35 38 Z" fill="currentColor" opacity="0.35" />
              <path d="M8 32 L26 29 L32 32 L26 35 Z" fill="currentColor" opacity="0.45" />
              <path d="M56 32 L38 35 L32 32 L38 29 Z" fill="currentColor" opacity="0.45" />
            </svg>
          </div>
          <div className="cmt-overlay__label">Modo Aventura</div>
          <div className="cmt-overlay__sub">A bruma se abre — exploração livre</div>
        </div>
      )}
    </div>
  );
}
