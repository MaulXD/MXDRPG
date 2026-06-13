"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  computeSiteTooltipPlacement,
  scanNativeTitles,
} from "@/lib/ui/site-tooltip";
import "./site-tooltip.css";

type TipState = {
  text: string;
  x: number;
  y: number;
};

const SHOW_DELAY_MS = 260;

export function SiteTooltipLayer() {
  const [tip, setTip] = useState<TipState | null>(null);
  const [placement, setPlacement] = useState({ left: 0, top: 0, flipAbove: false });
  const tipRef = useRef<HTMLDivElement>(null);
  const activeElRef = useRef<HTMLElement | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scanNativeTitles(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "title" &&
          mutation.target instanceof HTMLElement
        ) {
          scanNativeTitles(mutation.target);
        }
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) scanNativeTitles(node);
        });
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["title"],
    });

    const clearShowTimer = () => {
      if (showTimerRef.current != null) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };

    const hide = () => {
      clearShowTimer();
      activeElRef.current = null;
      setTip(null);
    };

    const showAt = (el: HTMLElement, x: number, y: number) => {
      const text = el.dataset.siteTip?.trim();
      if (!text) return;
      activeElRef.current = el;
      setTip({ text, x, y });
    };

    const onPointerOver = (e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>("[data-site-tip]");
      if (!el?.dataset.siteTip?.trim()) return;
      if (activeElRef.current === el) return;
      clearShowTimer();
      showTimerRef.current = setTimeout(() => showAt(el, e.clientX, e.clientY), SHOW_DELAY_MS);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!activeElRef.current) return;
      setTip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
    };

    const onPointerOut = (e: PointerEvent) => {
      const from = (e.target as Element).closest<HTMLElement>("[data-site-tip]");
      if (!from) return;
      const related = e.relatedTarget as Element | null;
      if (related && from.contains(related)) return;
      hide();
    };

    const onFocusIn = (e: FocusEvent) => {
      const el = (e.target as Element).closest<HTMLElement>("[data-site-tip]");
      if (!el?.dataset.siteTip?.trim()) return;
      const rect = el.getBoundingClientRect();
      showAt(el, rect.left + rect.width / 2, rect.bottom);
    };

    const onFocusOut = (e: FocusEvent) => {
      const from = (e.target as Element).closest<HTMLElement>("[data-site-tip]");
      if (!from) return;
      const related = e.relatedTarget as Element | null;
      if (related && from.contains(related)) return;
      hide();
    };

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      observer.disconnect();
      clearShowTimer();
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  useEffect(() => {
    if (!tip || !tipRef.current) return;
    const rect = tipRef.current.getBoundingClientRect();
    setPlacement(computeSiteTooltipPlacement(tip.x, tip.y, rect.width, rect.height));
  }, [tip]);

  if (!tip || typeof document === "undefined") return null;

  const style: CSSProperties = {
    left: placement.left,
    top: placement.top,
  };

  return createPortal(
    <div
      ref={tipRef}
      className={`site-tooltip${placement.flipAbove ? " site-tooltip--above" : ""}`}
      style={style}
      role="tooltip"
    >
      {tip.text}
    </div>,
    document.body
  );
}
