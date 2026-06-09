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
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, textarea, select, [data-no-drag]")) return;
      e.preventDefault();
      onFocus();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: layout.x,
        origY: layout.y,
      };

      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        onLayoutChange(
          clampDragPosition(
            dragRef.current.origX + dx,
            dragRef.current.origY + dy,
            layout.width,
            layout.minimized ? 40 : layout.height
          )
        );
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [layout.height, layout.minimized, layout.width, layout.x, layout.y, onFocus, onLayoutChange]
  );

  const onPointerMove = useCallback(() => undefined, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}
