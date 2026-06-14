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

type Props = {
  text?: string | null;
  children: ReactNode;
  className?: string;
};

type Coords = {
  top: number;
  left: number;
  transform: string;
};

function clampHorizontal(left: number, halfW: number, margin: number): number {
  return Math.max(margin + halfW, Math.min(window.innerWidth - margin - halfW, left));
}

/** Tooltip ao passar o mouse — wizard de criação (portal fixo, sem corte por overflow). */
export function WizardHoverTip({ text, children, className }: Props) {
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
    const gap = 10;
    const margin = 8;

    const left = clampHorizontal(a.left + a.width / 2, bw / 2, margin);

    const spaceBelow = window.innerHeight - margin - (a.bottom + gap);
    const spaceAbove = a.top - gap - margin;

    let top = a.bottom + gap;
    let transform = "translateX(-50%)";

    if (spaceAbove >= bh && spaceAbove >= spaceBelow) {
      top = a.top - gap;
      transform = "translate(-50%, -100%)";
    } else if (spaceBelow < bh && spaceAbove >= bh) {
      top = a.top - gap;
      transform = "translate(-50%, -100%)";
    }

    let visualTop = transform.includes("-100%") ? top - bh : top;
    let visualBottom = transform.includes("-100%") ? top : top + bh;

    if (visualTop < margin) {
      top = a.bottom + gap;
      transform = "translateX(-50%)";
      visualTop = top;
      visualBottom = top + bh;
    }

    if (visualBottom > window.innerHeight - margin) {
      if (transform === "translateX(-50%)") {
        top = Math.max(margin, window.innerHeight - margin - bh);
      } else {
        top = Math.max(margin + bh, a.top - gap);
        if (top - bh < margin) {
          top = Math.max(margin, Math.min(a.bottom + gap, window.innerHeight - margin - bh));
          transform = "translateX(-50%)";
        }
      }
    }

    setCoords({ top, left, transform });
  }, []);

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
  }, [open, text, reposition]);

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

  if (!text?.trim()) return <>{children}</>;

  const bubble =
    open && mounted
      ? createPortal(
          <span
            ref={bubbleRef}
            id={tooltipId}
            role="tooltip"
            className="wizard-hover-tip__bubble wizard-hover-tip__bubble--portal"
            style={{
              top: coords.top,
              left: coords.left,
              transform: coords.transform,
            }}
          >
            {text}
          </span>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={anchorRef}
        className={`wizard-hover-tip${className ? ` ${className}` : ""}`}
        tabIndex={0}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={openTip}
        onMouseLeave={closeTip}
        onFocus={openTip}
        onBlur={onFocusOut}
      >
        {children}
      </span>
      {bubble}
    </>
  );
}
