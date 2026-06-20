"use client";

import { useEffect, useState } from "react";
import { parsePrimaryDie } from "@/lib/room/chat-events";
import { Dice2DFallback } from "@/components/vtt/Dice2DFallback";
import { Dice3DCSS } from "@/components/vtt/Dice3DCSS";

type Props = {
  formula: string;
  value: number | null;
  rolling?: boolean;
  size?: "sm" | "md" | "lg";
};

const SIZE_PX: Record<NonNullable<Props["size"]>, number> = {
  sm: 56,
  md: 80,
  lg: 128,
};

export function DiceMiniature({ formula, value, rolling = false, size = "md" }: Props) {
  const sides = parsePrimaryDie(formula);
  const [landed, setLanded] = useState(false);
  const px = SIZE_PX[size];

  useEffect(() => {
    if (rolling) {
      setLanded(false);
      return;
    }
    if (value == null) return;
    const t = setTimeout(() => setLanded(true), 40);
    return () => clearTimeout(t);
  }, [rolling, value]);

  const display = value != null ? String(value) : "?";
  const isNat20 = value === 20 && sides === 20;
  const isNat1 = value === 1 && sides === 20;

  const wrapClass = [
    "dice-3d",
    `dice-3d--${size}`,
    rolling ? "dice-3d--rolling" : "",
    landed ? "dice-3d--landed" : "",
    isNat20 ? "dice-3d--nat20" : "",
    isNat1 ? "dice-3d--nat1" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // D20 combate (lg) usa CSS 3D — sem WebGL, sem contexto, sem bugs
  const useCSSd20 = size === "lg" && sides === 20;

  return (
    <div className={wrapClass} role="img" aria-label={`d${sides}: ${display}`}>
      <div className="dice-3d-stage">
        {useCSSd20 ? (
          <Dice3DCSS value={value} rolling={rolling} sizePx={px} />
        ) : (
          <>
            <Dice2DFallback display={display} rolling={rolling} />
            {(!rolling && value != null) ? (
              <span className="dice-3d-face dice-3d-face--overlay" aria-hidden>
                {display}
              </span>
            ) : null}
          </>
        )}
      </div>
      <span className="dice-3d-label">d{sides}</span>
    </div>
  );
}
