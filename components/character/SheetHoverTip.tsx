"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { SheetTipContent } from "@/lib/character/sheet-tooltips";

type Props = {
  tip: SheetTipContent | null | undefined;
  children: ReactNode;
  className?: string;
};

type Coords = {
  top: number;
  left: number;
  transform: string;
};

function portalThemeClass(className?: string): string {
  if (!className?.includes("sheet-ddb")) return "sheet-hover-tip__bubble--popup";
  return "sheet-hover-tip__bubble--ddb";
}

function portalModifierClass(className?: string): string {
  if (className?.includes("sheet-ddb-header__xp-tip")) {
    return "sheet-hover-tip__bubble--ddb-xp";
  }
  if (className?.includes("sheet-ddb-trait-tip")) {
    return "sheet-hover-tip__bubble--ddb-trait";
  }
  return "";
}

function isTraitTip(className?: string): boolean {
  return Boolean(className?.includes("sheet-ddb-trait-tip"));
}

/** Ficha DDB: abaixo do alvo — exceto traços (grade compacta). */
function prefersBelowAnchor(className?: string): boolean {
  if (!className?.includes("sheet-ddb")) return false;
  if (isTraitTip(className)) return false;
  return true;
}

function clampHorizontal(left: number, halfW: number, margin: number): number {
  return Math.max(margin + halfW, Math.min(window.innerWidth - margin - halfW, left));
}

function visualTop(top: number, transform: string, bh: number): number {
  return transform.includes("-100%") ? top - bh : top;
}

function visualBottom(top: number, transform: string, bh: number): number {
  return transform.includes("-100%") ? top : top + bh;
}

/** Tooltip em portal fixo — evita corte por overflow nos painéis da ficha. */
export function SheetHoverTip({ tip, children, className }: Props) {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<Coords>({
    top: 0,
    left: 0,
    transform: "translateX(-50%)",
  });

  useEffect(() => setMounted(true), []);

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const a = anchor.getBoundingClientRect();
    const b = bubbleRef.current?.getBoundingClientRect();
    const bw = b?.width ?? 248;
    const bh = b?.height ?? 96;
    const gap = 8;
    const margin = 8;

    if (isTraitTip(className)) {
      const spaceLeft = a.left - gap - margin;
      const spaceRight = window.innerWidth - margin - (a.right + gap);
      const spaceAbove = a.top - gap - margin;
      const spaceBelow = window.innerHeight - margin - (a.bottom + gap);
      let left: number;
      let top = a.top + a.height / 2;
      let transform: string;

      if (spaceLeft >= bw * 0.65) {
        left = a.left - gap;
        transform = "translate(-100%, -50%)";
      } else if (spaceRight >= bw * 0.65) {
        left = a.right + gap;
        transform = "translateY(-50%)";
      } else if (spaceAbove >= bh && spaceAbove >= spaceBelow) {
        left = clampHorizontal(a.left + a.width / 2, bw / 2, margin);
        top = a.top - gap;
        transform = "translate(-50%, -100%)";
        setCoords({ top, left, transform });
        return;
      } else if (spaceBelow >= bh) {
        left = clampHorizontal(a.left + a.width / 2, bw / 2, margin);
        top = a.bottom + gap;
        transform = "translateX(-50%)";
        setCoords({ top, left, transform });
        return;
      } else {
        left = clampHorizontal(a.left + a.width / 2, bw / 2, margin);
        const spaceBelow = window.innerHeight - margin - (a.bottom + gap);
        const spaceAbove = a.top - gap - margin;
        if (spaceAbove >= bh && spaceAbove >= spaceBelow) {
          top = a.top - gap;
          transform = "translate(-50%, -100%)";
        } else {
          top = a.bottom + gap;
          transform = "translateX(-50%)";
        }
        setCoords({ top, left, transform });
        return;
      }

      const halfH = bh / 2;
      top = Math.max(margin + halfH, Math.min(window.innerHeight - margin - halfH, top));
      if (transform === "translate(-100%, -50%)") {
        left = Math.max(margin + bw, left);
      } else {
        left = Math.min(window.innerWidth - margin - bw, left);
      }

      setCoords({ top, left, transform });
      return;
    }

    const left = clampHorizontal(a.left + a.width / 2, bw / 2, margin);

    const spaceBelow = window.innerHeight - margin - (a.bottom + gap);
    const spaceAbove = a.top - gap - margin;
    const forceBelow = prefersBelowAnchor(className);

    let top = a.bottom + gap;
    let transform = "translateX(-50%)";

    if (forceBelow) {
      if (spaceBelow < bh && spaceAbove > spaceBelow && spaceAbove >= bh) {
        top = a.top - gap;
        transform = "translate(-50%, -100%)";
      }
    } else if (spaceBelow < bh && spaceAbove >= bh) {
      top = a.top - gap;
      transform = "translate(-50%, -100%)";
    }

    let vTop = visualTop(top, transform, bh);
    let vBottom = visualBottom(top, transform, bh);

    if (vTop < margin) {
      top = a.bottom + gap;
      transform = "translateX(-50%)";
      vTop = top;
      vBottom = top + bh;
    }

    if (vBottom > window.innerHeight - margin) {
      if (transform === "translateX(-50%)") {
        top = Math.max(margin, window.innerHeight - margin - bh);
      } else {
        top = Math.max(margin + bh, a.top - gap);
        if (visualTop(top, transform, bh) < margin) {
          top = a.bottom + gap;
          transform = "translateX(-50%)";
          top = Math.max(margin, Math.min(top, window.innerHeight - margin - bh));
        }
      }
    }

    setCoords({ top, left, transform });
  }, [className]);

  const openTip = useCallback(() => setOpen(true), []);
  const closeTip = useCallback(() => setOpen(false), []);

  const onFocusOut = useCallback(
    (e: FocusEvent<HTMLSpanElement>) => {
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      closeTip();
    },
    [closeTip]
  );

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    const raf = requestAnimationFrame(() => reposition());
    return () => cancelAnimationFrame(raf);
  }, [open, tip, reposition]);

  useEffect(() => {
    if (!open) return;
    const onMove = () => reposition();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, reposition]);

  if (!tip?.lines.length && !tip?.title) return <>{children}</>;

  const themeClass = portalThemeClass(className);
  const modifierClass = portalModifierClass(className);
  const hoverOnly = isTraitTip(className);

  const bubble =
    open && mounted
      ? createPortal(
          <span
            ref={bubbleRef}
            id={tooltipId}
            role="tooltip"
            className={[
              "sheet-hover-tip__bubble",
              "sheet-hover-tip__bubble--portal",
              themeClass,
              modifierClass,
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.transform,
            }}
          >
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
          </span>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={anchorRef}
        className={`sheet-hover-tip${className ? ` ${className}` : ""}`}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={openTip}
        onMouseLeave={closeTip}
        onFocus={hoverOnly ? undefined : openTip}
        onBlur={hoverOnly ? undefined : onFocusOut}
      >
        {children}
      </span>
      {bubble}
    </>
  );
}
