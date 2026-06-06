"use client";

import type { ReactNode } from "react";

type Props = {
  tip: string;
  children: ReactNode;
  className?: string;
};

export function effectTipAttrs(tip: string, className = ""): {
  title: string;
  "data-tip": string;
  className: string;
} {
  return {
    title: tip,
    "data-tip": tip,
    className: `vtt-effect-tip-wrap${className ? ` ${className}` : ""}`,
  };
}

/** Tooltip nativo + balão CSS ao passar o mouse (descrição e duração). */
export function EffectHoverTip({ tip, children, className = "" }: Props) {
  const attrs = effectTipAttrs(tip, className);
  return <span {...attrs}>{children}</span>;
}
