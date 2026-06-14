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

  const variantClass = isIn ? "cmt--in-clash" : "cmt--out-split";

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
        <div className="cmt-overlay__label">{isIn ? "Modo Combate" : "Modo Aventura"}</div>
        <div className="cmt-overlay__sub">
          {isIn ? "Iniciativa e PA ativos" : "Exploração livre"}
        </div>
      </div>
    </div>
  );
}
