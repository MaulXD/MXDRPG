"use client";

import { useEffect, useState } from "react";
import { parsePrimaryDie } from "@/lib/room/chat-events";
import { Dice2DFallback } from "@/components/vtt/Dice2DFallback";
import { Dice3DCSS } from "@/components/vtt/Dice3DCSS";
import { DiceWebGL, type DiceWebGLProps } from "@/components/vtt/DiceWebGL";
import { DICE_LANDING_MS, DICE_LANDING_MS_REDUCED } from "@/lib/vtt/combat-fx-timings";

type Props = {
  formula: string;
  value: number | null;
  rolling?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: DiceWebGLProps["variant"];
  reducedMotion?: boolean;
};

const SIZE_PX: Record<NonNullable<Props["size"]>, number> = {
  sm: 56,
  md: 80,
  lg: 112,
};

/** Detecta se WebGL está disponível no navegador. */
function supportsWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      c.getContext("webgl2") ??
      c.getContext("webgl") ??
      c.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function DiceMiniature({
  formula,
  value,
  rolling = false,
  size = "md",
  variant = "attack",
  reducedMotion = false,
}: Props) {
  const sides = parsePrimaryDie(formula) as DiceWebGLProps["sides"];
  const [webGLOk, setWebGLOk] = useState<boolean | null>(null); // null = ainda verificando
  const [landed, setLanded] = useState(false);
  const px = SIZE_PX[size];

  // Verifica WebGL uma vez no cliente
  useEffect(() => {
    setWebGLOk(supportsWebGL());
  }, []);

  useEffect(() => {
    if (rolling) { setLanded(false); return; }
    if (value == null) return;
    const landingMs = reducedMotion ? DICE_LANDING_MS_REDUCED : DICE_LANDING_MS;
    const t = setTimeout(() => setLanded(true), landingMs);
    return () => clearTimeout(t);
  }, [rolling, value, reducedMotion]);

  const display = value != null ? String(value) : "?";
  const isNat20 = value === 20 && sides === 20;
  const isNat1  = value === 1  && sides === 20;

  // Tamanho lg = painel de combate
  const isLarge = size === "lg";
  const supportedSides: DiceWebGLProps["sides"][] = [4, 6, 8, 12, 20];
  const canWebGL = isLarge && supportedSides.includes(sides as DiceWebGLProps["sides"]);

  // Enquanto não sabemos se WebGL funciona, renderiza nada para evitar flash
  if (webGLOk === null && canWebGL) {
    return <div style={{ width: px, height: px }} />;
  }

  // Dados grandes no painel de combate: Three.js WebGL
  if (canWebGL && webGLOk) {
    const resolvedVariant =
      variant !== "attack"
        ? variant
        : isNat20
          ? "crit"
          : isNat1
            ? "damage"
            : "attack";
    return (
      <div className="dice-webgl-wrap" style={{ width: px, height: px }}>
        <DiceWebGL
          sides={sides as DiceWebGLProps["sides"]}
          value={rolling ? null : value}
          rolling={rolling}
          sizePx={px}
          variant={resolvedVariant}
          reducedMotion={reducedMotion}
        />
      </div>
    );
  }

  // Fallback CSS D20 (para d20 sem WebGL)
  if (isLarge && sides === 20) {
    return <Dice3DCSS value={value} rolling={rolling} sizePx={px} reducedMotion={reducedMotion} />;
  }

  // Fallback 2D para sm/md ou dados sem modelo WebGL
  const wrapClass = [
    "dice-3d",
    `dice-3d--${size}`,
    rolling ? "dice-3d--rolling" : "",
    landed  ? "dice-3d--landed"  : "",
    isNat20 ? "dice-3d--nat20"   : "",
    isNat1  ? "dice-3d--nat1"    : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={wrapClass} role="img" aria-label={`d${sides}: ${display}`}>
      <div className="dice-3d-stage">
        <Dice2DFallback display={display} rolling={rolling} />
        {!rolling && value != null ? (
          <span className="dice-3d-face dice-3d-face--overlay" aria-hidden>{display}</span>
        ) : null}
      </div>
      <span className="dice-3d-label">d{sides}</span>
    </div>
  );
}
