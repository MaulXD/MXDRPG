"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  value: number | null;
  rolling: boolean;
  sizePx: number;
};

// D20 (icosahedron) face: equilateral triangle dividido em 4 triângulos internos
const D20_OUTER = "50,4 96,81 4,81";
const D20_INNER_LINES: Array<[number, number, number, number]> = [
  [50, 4, 50, 81],   // vértice topo → base centro
  [50, 4, 4, 81],    // vértice topo → base esquerda (linha interna)
  [4, 81, 96, 81],   // base
  [27, 42, 73, 42],  // linha mediana horizontal
  [27, 42, 50, 81],  // baixo esquerdo → base centro
  [73, 42, 50, 81],  // baixo direito → base centro
];

function randomRot(seed: number, i: number): number {
  return ((seed * 7.3 + i * 13.7) % 360);
}

export function Dice3DCSS({ value, rolling, sizePx }: Props) {
  const display = value != null ? String(value) : "?";
  const isNat20 = value === 20;
  const isNat1 = value === 1;

  // Seed de rotação aleatória para a animação de pouso
  const seedRef = useRef(0);
  const [rotClass, setRotClass] = useState<"rolling" | "landing" | "settled">("settled");

  useEffect(() => {
    if (rolling) {
      seedRef.current = Math.floor(Math.random() * 1000);
      setRotClass("rolling");
    } else {
      setRotClass("landing");
      const t = setTimeout(() => setRotClass("settled"), 520);
      return () => clearTimeout(t);
    }
  }, [rolling]);

  const cn = [
    "d20-css",
    rotClass === "rolling" ? "d20-css--rolling" : "",
    rotClass === "landing" ? "d20-css--landing" : "",
    rotClass === "settled" ? "d20-css--settled" : "",
    isNat20 ? "d20-css--nat20" : "",
    isNat1 ? "d20-css--nat1" : "",
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
          className="d20-css-svg"
          viewBox="0 0 100 85"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Face principal — triângulo externo */}
          <polygon
            points={D20_OUTER}
            className="d20-css-face-poly"
          />
          {/* Linhas internas do icosahedro */}
          {D20_INNER_LINES.map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              className="d20-css-inner-line"
            />
          ))}
          {/* Número central */}
          <text x="50" y="56" className="d20-css-number">
            {rotClass === "rolling" ? "" : display}
          </text>
        </svg>
        {/* Reflexo de luz no canto superior do dado */}
        <div className="d20-css-shine" aria-hidden />
      </div>
    </div>
  );
}
