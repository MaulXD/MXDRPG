"use client";

import { useCallback, useRef } from "react";
import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";
import { clampDragPosition } from "@/lib/vtt/foundry-window-placement";

export type FoundryWindowDragHandlers = {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
};

export function useFoundryWindowDrag(
  layout: FoundryWindowLayout,
  onLayoutChange: (patch: Partial<FoundryWindowLayout>) => void,
  onFocus: () => void
): FoundryWindowDragHandlers {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      onFocus();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: layout.x,
        origY: layout.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [layout.x, layout.y, onFocus]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const next = clampDragPosition(
        dragRef.current.origX + dx,
        dragRef.current.origY + dy,
        layout.width,
        layout.minimized ? 40 : layout.height
      );
      onLayoutChange(next);
    },
    [layout.height, layout.minimized, layout.width, onLayoutChange]
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}
