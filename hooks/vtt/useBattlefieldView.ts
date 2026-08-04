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

  /**
   * Ferramenta de mão — em touch, um dedo arrasta o mapa em vez de agir no
   * token. Fica desligada por padrão: com ela ligada não daria para mover
   * token nem atacar, e o gesto de dois dedos já cobre o caso comum.
   */
  const [panToolActive, setPanToolActive] = useState(false);
  const panToolRef = useRef(panToolActive);
  panToolRef.current = panToolActive;

  /**
   * Ponteiros de toque ativos sobre o canvas. Necessário para pinça: com dois
   * dedos, a distância entre eles dita o zoom e o ponto médio dita o pan.
   */
  const touchesRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{
    startDist: number;
    startScale: number;
    startMidX: number;
    startMidY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

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

  /**
   * Gatilhos de pan com mouse. Em touch nada disso vale: um toque chega
   * sempre como `button === 0` sem modificador, e é justamente por isso que
   * arrastar o mapa era impossível no dedo antes dos gestos abaixo.
   */
  const isPanButton = (e: React.PointerEvent) =>
    e.button === 1 || (e.button === 0 && (e.altKey || e.shiftKey));

  const isTouchPointer = (e: React.PointerEvent) =>
    e.pointerType === "touch" || e.pointerType === "pen";

  const localPos = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [canvasRef]
  );

  const clearPinch = useCallback(() => {
    pinchRef.current = null;
  }, []);

  const beginPan = useCallback(
    (e: React.PointerEvent, at: { x: number; y: number }) => {
      panRef.current = {
        pointerId: e.pointerId,
        startX: at.x,
        startY: at.y,
        panX: viewRef.current.panX,
        panY: viewRef.current.panY,
      };
      setIsPanning(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    []
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const at = localPos(e);

      if (isTouchPointer(e)) {
        if (at) touchesRef.current.set(e.pointerId, at);

        // Dois dedos → pinça. Assume o controle da vista e cancela qualquer
        // pan de um dedo que já estivesse em curso, para o primeiro dedo não
        // arrastar o mapa junto com a pinça.
        if (touchesRef.current.size === 2) {
          const [a, b] = [...touchesRef.current.values()];
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          if (dist > 0) {
            pinchRef.current = {
              startDist: dist,
              startScale: viewRef.current.scale,
              startMidX: (a.x + b.x) / 2,
              startMidY: (a.y + b.y) / 2,
              startPanX: viewRef.current.panX,
              startPanY: viewRef.current.panY,
            };
          }
          panRef.current = null;
          setIsPanning(true);
          return true;
        }

        // Um dedo só arrasta o mapa com a ferramenta de mão ligada — sem ela,
        // o toque continua indo para token/célula (selecionar, mover, atacar).
        if (touchesRef.current.size === 1 && panToolRef.current && at) {
          e.preventDefault();
          beginPan(e, at);
          return true;
        }

        return false;
      }

      if (!isPanButton(e)) return false;
      e.preventDefault();
      if (!at) return true;
      beginPan(e, at);
      return true;
    },
    [beginPan, localPos]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isTouchPointer(e)) {
        const at = localPos(e);
        if (!at) return Boolean(pinchRef.current) || Boolean(panRef.current);
        if (touchesRef.current.has(e.pointerId)) touchesRef.current.set(e.pointerId, at);

        const pinch = pinchRef.current;
        if (pinch && touchesRef.current.size >= 2) {
          const [a, b] = [...touchesRef.current.values()];
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          if (dist <= 0) return true;

          const canvas = canvasRef.current;
          const wrap = wrapRef.current;
          const { w, h } = canvasSize(canvas, wrap);
          if (w < 10 || h < 10) return true;

          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;

          // 1) Zoom ancorado no ponto médio inicial — o conteúdo sob os dedos
          //    fica parado, que é o que dá a sensação de pinça de verdade.
          const zoomed = zoomViewAtPointer(
            {
              scale: pinch.startScale,
              panX: pinch.startPanX,
              panY: pinch.startPanY,
            },
            pinch.startMidX,
            pinch.startMidY,
            w,
            h,
            pinch.startScale * (dist / pinch.startDist)
          );

          // 2) E o ponto médio arrastando move o mapa — pinça e pan no mesmo gesto.
          bumpView(
            {
              scale: zoomed.scale,
              panX: zoomed.panX + (midX - pinch.startMidX),
              panY: zoomed.panY + (midY - pinch.startMidY),
            },
            { syncState: true }
          );
          return true;
        }
      }

      const pan = panRef.current;
      if (!pan || pan.pointerId !== e.pointerId) return false;
      const at = localPos(e);
      if (!at) return true;
      bumpView(
        {
          ...viewRef.current,
          panX: pan.panX + (at.x - pan.startX),
          panY: pan.panY + (at.y - pan.startY),
        },
        { syncState: true }
      );
      return true;
    },
    [bumpView, canvasRef, localPos, wrapRef]
  );

  const endPan = useCallback(
    (e: React.PointerEvent) => {
      let claimed = false;

      if (isTouchPointer(e)) {
        const had = touchesRef.current.delete(e.pointerId);
        // Ao soltar um dedo da pinça, encerra o gesto em vez de degenerar em
        // pan com o dedo restante — o salto de posição seria visível.
        if (pinchRef.current && touchesRef.current.size < 2) {
          clearPinch();
          claimed = true;
        }
        if (had && touchesRef.current.size === 0) claimed = claimed || !panRef.current;
      }

      const pan = panRef.current;
      if (pan && pan.pointerId === e.pointerId) {
        panRef.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        claimed = true;
      }

      if (!panRef.current && !pinchRef.current) setIsPanning(false);
      return claimed;
    },
    [clearPinch]
  );

  /**
   * `pointercancel` é rotina em touch (o navegador assume o gesto, o dedo sai
   * da tela, chega uma chamada do sistema). Sem tratar, o ponteiro fica preso
   * no mapa de toques e a pinça seguinte nasce com contagem errada.
   */
  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      touchesRef.current.delete(e.pointerId);
      if (touchesRef.current.size < 2) clearPinch();
      if (panRef.current?.pointerId === e.pointerId) panRef.current = null;
      if (!panRef.current && !pinchRef.current) setIsPanning(false);
    },
    [clearPinch]
  );

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

  const togglePanTool = useCallback(() => setPanToolActive((v) => !v), []);

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
    panToolActive,
    setPanToolActive,
    togglePanTool,
    onPointerDown,
    onPointerMove,
    endPan,
    onPointerCancel,
    subscribeViewDraw,
    scaleMin: BATTLEFIELD_SCALE_MIN,
    scaleMax: BATTLEFIELD_SCALE_MAX,
    canZoomIn: view.scale < BATTLEFIELD_SCALE_MAX - 0.01,
    canZoomOut: view.scale > BATTLEFIELD_SCALE_MIN + 0.01,
  };
}
