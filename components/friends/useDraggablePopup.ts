"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const MARGIN = 8;

export type PopupPoint = { left: number; top: number };

function clampPoint(left: number, top: number, width: number, height: number): PopupPoint {
  const maxLeft = Math.max(MARGIN, window.innerWidth - width - MARGIN);
  const maxTop = Math.max(MARGIN, window.innerHeight - height - MARGIN);
  return {
    left: Math.min(Math.max(MARGIN, left), maxLeft),
    top: Math.min(Math.max(MARGIN, top), maxTop),
  };
}

export function defaultPopupPoint(width: number, height: number): PopupPoint {
  return clampPoint(window.innerWidth - width - 16, window.innerHeight - height - 16, width, height);
}

type Options = {
  width: number;
  height: number;
  enabled: boolean;
};

export function useDraggablePopup({ width, height, enabled }: Options) {
  const [pos, setPos] = useState<PopupPoint | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    if (pos) return;
    setPos(defaultPopupPoint(width, height));
  }, [enabled, pos, width, height]);

  useEffect(() => {
    if (!enabled || !pos) return;
    const onResize = () => setPos((p) => (p ? clampPoint(p.left, p.top, width, height) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enabled, pos, width, height]);

  const onDragPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
      const panel = panelRef.current;
      if (!panel) return;

      const rect = panel.getBoundingClientRect();
      const origin = pos ?? { left: rect.left, top: rect.top };
      if (!pos) setPos(origin);

      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origLeft: origin.left,
        origTop: origin.top,
      };
      panel.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [pos]
  );

  const onDragPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setPos(clampPoint(drag.origLeft + dx, drag.origTop + dy, width, height));
    },
    [width, height]
  );

  const onDragPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    panelRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  return {
    panelRef,
    pos,
    panelStyle: pos ? ({ left: pos.left, top: pos.top } as const) : undefined,
    onDragPointerDown,
    onDragPointerMove,
    onDragPointerUp,
  };
}
