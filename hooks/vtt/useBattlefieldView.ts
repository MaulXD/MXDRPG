"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  BATTLEFIELD_SCALE_MAX,
  BATTLEFIELD_SCALE_MIN,
  DEFAULT_BATTLEFIELD_VIEW,
  type BattlefieldView,
  zoomViewAtPointer,
} from "@/lib/vtt/battlefield-view";

type Params = {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

function canvasSize(canvas: HTMLCanvasElement | null, wrap: HTMLElement | null) {
  const w = canvas?.clientWidth ?? wrap?.clientWidth ?? 0;
  const h = canvas?.clientHeight ?? wrap?.clientHeight ?? 0;
  return { w, h };
}

const ARROW_PAN_STEP_PX = 48;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function useBattlefieldView({ wrapRef, canvasRef }: Params) {
  const [view, setView] = useState<BattlefieldView>(DEFAULT_BATTLEFIELD_VIEW);
  const viewRef = useRef(view);
  viewRef.current = view;

  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const bumpView = useCallback((next: BattlefieldView) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const resetView = useCallback(() => {
    bumpView(DEFAULT_BATTLEFIELD_VIEW);
  }, [bumpView]);

  const zoomBy = useCallback(
    (factor: number) => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas) return;
      const { w, h } = canvasSize(canvas, wrap);
      if (w < 10 || h < 10) return;
      const cx = w / 2;
      const cy = h / 2;
      bumpView(zoomViewAtPointer(viewRef.current, cx, cy, w, h, viewRef.current.scale * factor));
    },
    [bumpView, canvasRef, wrapRef]
  );

  const zoomIn = useCallback(() => zoomBy(1.15), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / 1.15), [zoomBy]);

  const panBy = useCallback(
    (dx: number, dy: number) => {
      if (dx === 0 && dy === 0) return;
      bumpView({
        ...viewRef.current,
        panX: viewRef.current.panX + dx,
        panY: viewRef.current.panY + dy,
      });
    },
    [bumpView]
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      const target = e.target;
      if (target instanceof HTMLElement && target.closest(".vtt-help-backdrop")) return;

      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const { w, h } = canvasSize(canvas, wrap);
      const delta = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      bumpView(
        zoomViewAtPointer(viewRef.current, px, py, w, h, viewRef.current.scale * delta)
      );
    },
    [bumpView, canvasRef, wrapRef]
  );

  const isPanButton = (e: React.PointerEvent) =>
    e.button === 1 || (e.button === 0 && (e.altKey || e.shiftKey));

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanButton(e)) return false;
      e.preventDefault();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return true;
      panRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        panX: viewRef.current.panX,
        panY: viewRef.current.panY,
      };
      setIsPanning(true);
      e.currentTarget.setPointerCapture(e.pointerId);
      return true;
    },
    [canvasRef]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return false;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return true;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    bumpView({
      ...viewRef.current,
      panX: pan.panX + (px - pan.startX),
      panY: pan.panY + (py - pan.startY),
    });
    return true;
  }, [bumpView, canvasRef]);

  const endPan = useCallback((e: React.PointerEvent) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return false;
    panRef.current = null;
    setIsPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    return true;
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      let dx = 0;
      let dy = 0;
      switch (e.key) {
        case "ArrowLeft":
          dx = ARROW_PAN_STEP_PX;
          break;
        case "ArrowRight":
          dx = -ARROW_PAN_STEP_PX;
          break;
        case "ArrowUp":
          dy = ARROW_PAN_STEP_PX;
          break;
        case "ArrowDown":
          dy = -ARROW_PAN_STEP_PX;
          break;
        default:
          return;
      }

      e.preventDefault();
      panBy(dx, dy);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panBy]);

  const zoomPercent = Math.round(view.scale * 100);

  return {
    view,
    viewRef,
    isPanning,
    zoomPercent,
    zoomIn,
    zoomOut,
    resetView,
    panBy,
    onWheel,
    onPointerDown,
    onPointerMove,
    endPan,
    scaleMin: BATTLEFIELD_SCALE_MIN,
    scaleMax: BATTLEFIELD_SCALE_MAX,
    canZoomIn: view.scale < BATTLEFIELD_SCALE_MAX - 0.01,
    canZoomOut: view.scale > BATTLEFIELD_SCALE_MIN + 0.01,
  };
}
