"use client";

import { useCallback, useState, type MouseEvent, type ReactNode } from "react";
import { EffectCursorDetail } from "@/components/vtt/EffectCursorDetail";

type Props = {
  tip: string;
  children: ReactNode;
  className?: string;
};

export function effectTipAttrs(tip: string, className = ""): {
  "aria-label": string;
  className: string;
} {
  return {
    "aria-label": tip,
    className: `vtt-effect-tip-wrap${className ? ` ${className}` : ""}`,
  };
}

/** Painel ao lado do cursor (mesmo esquema do Action Ring). */
export function EffectHoverTip({ tip, children, className = "" }: Props) {
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const syncPointer = useCallback((e: MouseEvent<HTMLElement>) => {
    setPointer({ x: e.clientX, y: e.clientY });
  }, []);

  const attrs = effectTipAttrs(tip, className);

  return (
    <>
      <span
        {...attrs}
        onMouseEnter={syncPointer}
        onMouseMove={syncPointer}
        onMouseLeave={() => setPointer(null)}
      >
        {children}
      </span>
      {pointer ? (
        <EffectCursorDetail pointer={pointer}>
          <p className="token-action-ring__detail-hint">{tip}</p>
        </EffectCursorDetail>
      ) : null}
    </>
  );
}
