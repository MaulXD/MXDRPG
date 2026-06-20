"use client";

import React, { useEffect, useRef, useState } from "react";

import { DICE_LANDING_MS, DICE_LANDING_MS_REDUCED } from "@/lib/vtt/combat-fx-timings";

type Props = {
  value: number | null;
  rolling: boolean;
  sizePx: number;
  reducedMotion?: boolean;
};

const SCRAMBLE = [20, 7, 13, 4, 17, 2, 11, 18, 6, 15, 9, 3, 16, 8, 1, 19, 5, 14, 12, 10];

export function Dice3DCSS({ value, rolling, sizePx, reducedMotion = false }: Props) {
  const isNat20 = value === 20;
  const isNat1 = value === 1;

  const [scramIdx, setScramIdx] = useState(0);
  const [rotState, setRotState] = useState<"rolling" | "landing" | "settled">("settled");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rolling) {
      setRotState("rolling");
      let i = 0;
      intervalRef.current = setInterval(() => {
        i = (i + 1) % SCRAMBLE.length;
        setScramIdx(i);
      }, 75);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRotState("landing");
      const landingMs = reducedMotion ? DICE_LANDING_MS_REDUCED : DICE_LANDING_MS;
      const t = setTimeout(() => setRotState("settled"), landingMs);
      return () => clearTimeout(t);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rolling, reducedMotion]);

  const display = rolling ? String(SCRAMBLE[scramIdx]) : String(value ?? "?");

  const cn = [
    "d20-css",
    rotState === "rolling" ? "d20-css--rolling" : "",
    rotState === "landing" ? "d20-css--landing" : "",
    rotState === "settled" ? "d20-css--settled" : "",
    !rolling && isNat20 ? "d20-css--nat20" : "",
    !rolling && isNat1 ? "d20-css--nat1" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cn}
      style={{ "--d20-size": `${sizePx}px` } as React.CSSProperties}
      aria-hidden
    >
      <div className="d20-css-stage">
        <svg
          viewBox="0 0 100 100"
          className="d20-css-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* D20 outer polygon — decagon */}
          <polygon
            points="50,4 80,16 95,42 95,68 80,86 50,96 20,86 5,68 5,42 20,16"
            className="d20-css-face-poly"
          />
          {/* Inner octagon — inner facets */}
          <polygon
            points="50,20 68,30 75,50 68,70 50,80 32,70 25,50 32,30"
            fill="none"
            className="d20-css-inner-line"
          />
          {/* Radial lines from outer to inner */}
          <line x1="50" y1="4"  x2="50" y2="20" className="d20-css-inner-line" />
          <line x1="80" y1="16" x2="68" y2="30" className="d20-css-inner-line" />
          <line x1="95" y1="42" x2="75" y2="50" className="d20-css-inner-line" />
          <line x1="95" y1="68" x2="68" y2="70" className="d20-css-inner-line" />
          <line x1="80" y1="86" x2="50" y2="80" className="d20-css-inner-line" />
          <line x1="20" y1="86" x2="50" y2="80" className="d20-css-inner-line" />
          <line x1="5"  y1="68" x2="32" y2="70" className="d20-css-inner-line" />
          <line x1="5"  y1="42" x2="25" y2="50" className="d20-css-inner-line" />
          <line x1="20" y1="16" x2="32" y2="30" className="d20-css-inner-line" />
          {/* Number */}
          <text x="50" y="56" className="d20-css-number">
            {display}
          </text>
        </svg>
        <div className="d20-css-shine" aria-hidden />
      </div>
    </div>
  );
}
