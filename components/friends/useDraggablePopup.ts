"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

const MARGIN = 8;

export type PopupPoint = { left: number; top: number };
export type PopupSize = { width: number; height: number };

function viewportMaxSize(): PopupSize {
  return {
    width: Math.max(280, window.innerWidth - MARGIN * 2),
    height: Math.max(280, window.innerHeight - MARGIN * 2),
  };
}

function clampSize(
  width: number,
  height: number,
  minWidth: number,
  minHeight: number
): PopupSize {
  const max = viewportMaxSize();
  return {
    width: Math.min(Math.max(minWidth, width), max.width),
    height: Math.min(Math.max(minHeight, height), max.height),
  };
}

function clampPoint(left: number, top: number, size: PopupSize): PopupPoint {
  const maxLeft = Math.max(MARGIN, window.innerWidth - size.width - MARGIN);
  const maxTop = Math.max(MARGIN, window.innerHeight - size.height - MARGIN);
  return {
    left: Math.min(Math.max(MARGIN, left), maxLeft),
    top: Math.min(Math.max(MARGIN, top), maxTop),
  };
}

export function defaultPopupPoint(size: PopupSize): PopupPoint {
  return clampPoint(window.innerWidth - size.width - 16, window.innerHeight - size.height - 16, size);
}

type StoredLayout = { pos: PopupPoint; size: PopupSize };

function readStoredLayout(key: string): StoredLayout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<StoredLayout>;
    if (
      typeof data.pos?.left !== "number" ||
      typeof data.pos?.top !== "number" ||
      typeof data.size?.width !== "number" ||
      typeof data.size?.height !== "number"
    ) {
      return null;
    }
    return { pos: data.pos, size: data.size };
  } catch {
    return null;
  }
}

function writeStoredLayout(key: string, layout: StoredLayout) {
  try {
    localStorage.setItem(key, JSON.stringify(layout));
  } catch {
    /* quota / private mode */
  }
}

type Options = {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  enabled: boolean;
  /** Persiste posição e tamanho entre sessões */
  storageKey?: string;
};

export function useDraggablePopup({
  width,
  height,
  minWidth = 300,
  minHeight = 320,
  enabled,
  storageKey,
}: Options) {
  const [pos, setPos] = useState<PopupPoint | null>(null);
  const [size, setSize] = useState<PopupSize | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
  } | null>(null);
  const resizeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<PopupSize | null>(null);
  const layoutRef = useRef<StoredLayout | null>(null);
  sizeRef.current = size;
  if (pos && size) layoutRef.current = { pos, size };

  const clampLayout = useCallback(
    (nextPos: PopupPoint, nextSize: PopupSize): StoredLayout => {
      const clampedSize = clampSize(nextSize.width, nextSize.height, minWidth, minHeight);
      const clampedPos = clampPoint(nextPos.left, nextPos.top, clampedSize);
      return { pos: clampedPos, size: clampedSize };
    },
    [minWidth, minHeight]
  );

  const persistLayout = useCallback(
    (layout: StoredLayout) => {
      if (!storageKey) return;
      writeStoredLayout(storageKey, layout);
    },
    [storageKey]
  );

  useEffect(() => {
    if (!enabled) return;
    if (pos && size) return;

    const stored = storageKey ? readStoredLayout(storageKey) : null;
    const initialSize = clampSize(
      stored?.size.width ?? width,
      stored?.size.height ?? height,
      minWidth,
      minHeight
    );
    const initialPos = stored?.pos
      ? clampPoint(stored.pos.left, stored.pos.top, initialSize)
      : defaultPopupPoint(initialSize);

    setSize(initialSize);
    setPos(initialPos);
  }, [enabled, pos, size, width, height, minWidth, minHeight, storageKey]);

  useEffect(() => {
    if (!enabled) return;
    const onWindowResize = () => {
      const current = sizeRef.current;
      if (!current) return;
      const nextSize = clampSize(current.width, current.height, minWidth, minHeight);
      setSize(nextSize);
      setPos((p) => (p ? clampPoint(p.left, p.top, nextSize) : p));
    };
    window.addEventListener("resize", onWindowResize);
    return () => window.removeEventListener("resize", onWindowResize);
  }, [enabled, minWidth, minHeight]);

  const onDragPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
      const panel = panelRef.current;
      if (!panel || !size) return;

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
    [pos, size]
  );

  const onDragPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId || !size) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      const nextPos = clampPoint(drag.origLeft + dx, drag.origTop + dy, size);
      setPos(nextPos);
      layoutRef.current = { pos: nextPos, size };
    },
    [size]
  );

  const onDragPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      dragRef.current = null;
      panelRef.current?.releasePointerCapture(e.pointerId);
      if (layoutRef.current) persistLayout(layoutRef.current);
    },
    [persistLayout]
  );

  const onResizePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0 || !size) return;
      e.stopPropagation();
      resizeRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origW: size.width,
        origH: size.height,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [size]
  );

  const onResizePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const resize = resizeRef.current;
      if (!resize || resize.pointerId !== e.pointerId || !pos) return;
      const dw = e.clientX - resize.startX;
      const dh = e.clientY - resize.startY;
      const next = clampLayout(pos, {
        width: resize.origW + dw,
        height: resize.origH + dh,
      });
      setSize(next.size);
      setPos(next.pos);
      layoutRef.current = next;
    },
    [pos, clampLayout]
  );

  const onResizePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const resize = resizeRef.current;
      if (!resize || resize.pointerId !== e.pointerId) return;
      resizeRef.current = null;
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (layoutRef.current) persistLayout(layoutRef.current);
    },
    [persistLayout]
  );

  const onPanelPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      onDragPointerMove(e);
      onResizePointerMove(e);
    },
    [onDragPointerMove, onResizePointerMove]
  );

  const onPanelPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      onDragPointerUp(e);
      onResizePointerUp(e);
    },
    [onDragPointerUp, onResizePointerUp]
  );

  return {
    panelRef,
    pos,
    size,
    panelStyle:
      pos && size
        ? ({
            left: pos.left,
            top: pos.top,
            width: size.width,
            height: size.height,
          } as const)
        : undefined,
    onDragPointerDown,
    onResizePointerDown,
    onPanelPointerMove,
    onPanelPointerUp,
  };
}
