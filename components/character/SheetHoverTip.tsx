"use client";

import type { ReactNode } from "react";
import type { SheetTipContent } from "@/lib/character/sheet-tooltips";

type Props = {
  tip: SheetTipContent | null | undefined;
  children: ReactNode;
  className?: string;
};

/** Tooltip elegante para chips e ações rápidas da ficha popup. */
export function SheetHoverTip({ tip, children, className }: Props) {
  if (!tip?.lines.length && !tip?.title) return <>{children}</>;

  return (
    <span className={`sheet-hover-tip${className ? ` ${className}` : ""}`}>
      {children}
      <span className="sheet-hover-tip__bubble" role="tooltip">
        {tip.title ? <strong className="sheet-hover-tip__title">{tip.title}</strong> : null}
        {tip.lines.map((line, i) =>
          line === "" ? (
            <span key={`sp-${i}`} className="sheet-hover-tip__spacer" aria-hidden />
          ) : (
            <span key={`${line.slice(0, 24)}-${i}`} className="sheet-hover-tip__line">
              {line}
            </span>
          )
        )}
      </span>
    </span>
  );
}
