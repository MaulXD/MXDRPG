"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  startTransition,
  type RefObject,
} from "react";
import {
  BATTLEFIELD_SCALE_MAX,
  BATTLEFIELD_SCALE_MIN,
  DEFAULT_BATTLEFIELD_VIEW,
  panViewToCenterWorld,
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
  const centerAnimRef = useRef<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const viewDrawListenersRef = useRef(new Set<() => void>());
  const flushViewStateRef = useRef<number | null>(null);

  const notifyViewDraw = useCallback(() => {
    for (const fn of viewDrawListenersRef.current) fn();
  }, []);

  const scheduleViewStateFlush = useCallback(() => {
    if (flushViewStateRef.current != null) return;
    flushViewStateRef.current = requestAnimationFrame(() => {
      flushViewStateRef.current = null;
      startTransition(() => {
        setView(viewRef.current);
      });
    });
  }, []);

  const bumpView = useCallback(
    (next: BattlefieldView, options?: { syncState?: boolean }) => {
      viewRef.current = next;
      notifyViewDraw();
      if (options?.syncState) {
        setView(next);
        return;
      }
      scheduleViewStateFlush();
    },
    [notifyViewDraw, scheduleViewStateFlush]
  );

  useEffect(
    () => () => {
      if (flushViewStateRef.current != null) {
        cancelAnimationFrame(flushViewStateRef.current);
      }
      if (centerAnimRef.current != null) {
        cancelAnimationFrame(centerAnimRef.current);
      }
    },
    []
  );

  const subscribeViewDraw = useCallback((fn: () => void) => {
    viewDrawListenersRef.current.add(fn);
    return () => {
      viewDrawListenersRef.current.delete(fn);
    };
  }, []);

  const resetView = useCallback(() => {
    if (centerAnimRef.current != null) {
      cancelAnimationFrame(centerAnimRef.current);
      centerAnimRef.current = null;
    }
    bumpView(DEFAULT_BATTLEFIELD_VIEW, { syncState: true });
  }, [bumpView]);

  const centerOnWorld = useCallback(
    (wx: number, wy: number, options?: { animate?: boolean }) => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas) return;
      const { w, h } = canvasSize(canvas, wrap);
      if (w < 10 || h < 10) return;

      if (centerAnimRef.current != null) {
        cancelAnimationFrame(centerAnimRef.current);
        centerAnimRef.current = null;
      }

      const target = panViewToCenterWorld(viewRef.current, wx, wy, w, h);
      const animate = options?.animate !== false;

      if (!animate) {
        bumpView(target, { syncState: true });
        return;
      }

      const start = viewRef.current;
      const durationMs = 280;
      const t0 = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / durationMs);
        const ease = t * (2 - t);
        bumpView({
          scale: start.scale,
          panX: start.panX + (target.panX - start.panX) * ease,
          panY: start.panY + (target.panY - start.panY) * ease,
        });
        if (t < 1) {
          centerAnimRef.current = requestAnimationFrame(step);
        } else {
          centerAnimRef.current = null;
          bumpView(target, { syncState: true });
        }
      };

      centerAnimRef.current = requestAnimationFrame(step);
    },
    [bumpView, canvasRef, wrapRef]
  );

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

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    function onWheel(e: WheelEvent) {
      const target = e.target;
      if (target instanceof HTMLElement && target.closest(".vtt-help-backdrop")) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const { w, h } = canvasSize(canvas, wrap);
      const delta = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      bumpView(
        zoomViewAtPointer(viewRef.current, px, py, w, h, viewRef.current.scale * delta)
      );
    }

    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
  }, [bumpView, canvasRef, wrapRef]);

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
    centerOnWorld,
    panBy,
    onPointerDown,
    onPointerMove,
    endPan,
    subscribeViewDraw,
    scaleMin: BATTLEFIELD_SCALE_MIN,
    scaleMax: BATTLEFIELD_SCALE_MAX,
    canZoomIn: view.scale < BATTLEFIELD_SCALE_MAX - 0.01,
    canZoomOut: view.scale > BATTLEFIELD_SCALE_MIN + 0.01,
  };
}
