"use client";

import { useCallback, useRef, type ReactNode } from "react";
import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";
import { clampDragPosition } from "@/lib/vtt/foundry-window-placement";
import "./foundry.css";

type Props = {
  title: string;
  layout: FoundryWindowLayout;
  onLayoutChange: (patch: Partial<FoundryWindowLayout>) => void;
  onClose: () => void;
  onMinimize: () => void;
  onFocus: () => void;
  children: ReactNode;
  className?: string;
  minWidth?: number;
  minHeight?: number;
  /** Botões extras na barra (ex.: exportar PDF) — antes de recolher/fechar */
  headerExtra?: ReactNode;
};

export function FoundryWindow({
  title,
  layout,
  onLayoutChange,
  onClose,
  onMinimize,
  onFocus,
  children,
  className = "",
  minWidth = 220,
  minHeight = 120,
  headerExtra,
}: Props) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const onHeaderPointerDown = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
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

  const onHeaderPointerMove = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
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
    [onLayoutChange]
  );

  const onHeaderPointerUp = useCallback((e: React.PointerEvent<HTMLSpanElement>) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      onFocus();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origW: layout.width,
        origH: layout.height,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [layout.width, layout.height, onFocus]
  );

  const onResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!resizeRef.current) return;
      const dw = e.clientX - resizeRef.current.startX;
      const dh = e.clientY - resizeRef.current.startY;
      onLayoutChange({
        width: Math.max(minWidth, resizeRef.current.origW + dw),
        height: Math.max(minHeight, resizeRef.current.origH + dh),
      });
    },
    [minWidth, minHeight, onLayoutChange]
  );

  const onResizePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    resizeRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  if (!layout.open) return null;

  return (
    <div
      className={`foundry-window ${layout.minimized ? "foundry-window--minimized" : ""} ${className}`.trim()}
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.minimized ? undefined : layout.height,
        zIndex: layout.z,
      }}
      onPointerDown={onFocus}
      role="dialog"
      aria-label={title}
    >
      <div className="foundry-window__header">
        <span
          className="foundry-window__title"
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={onHeaderPointerUp}
          onPointerCancel={onHeaderPointerUp}
        >
          {title}
        </span>
        <div
          className="foundry-window__actions"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {headerExtra}
          <button
            type="button"
            className="foundry-window__btn"
            onClick={onMinimize}
            aria-label={layout.minimized ? "Restaurar janela" : "Recolher janela"}
            title={layout.minimized ? "Restaurar" : "Recolher"}
          >
            {layout.minimized ? (
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                <rect
                  x="2.5"
                  y="2.5"
                  width="7"
                  height="7"
                  rx="1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                <line
                  x1="2.5"
                  y1="6"
                  x2="9.5"
                  y2="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="foundry-window__btn foundry-window__btn--close"
            onClick={onClose}
            aria-label="Fechar janela"
            title="Fechar"
          >
            <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
              <line
                x1="2.5"
                y1="2.5"
                x2="9.5"
                y2="9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="9.5"
                y1="2.5"
                x2="2.5"
                y2="9.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      {!layout.minimized ? (
        <div className="foundry-window__body">{children}</div>
      ) : null}
      {!layout.minimized ? (
        <div
          className="foundry-window__resize"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
