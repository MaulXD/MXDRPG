"use client";

import { useCallback, useRef, type ReactNode } from "react";
import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";
import { EldarinCorners } from "@/components/ui/EldarinCorners";
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
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return;
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
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      onLayoutChange({
        x: Math.max(48, dragRef.current.origX + dx),
        y: Math.max(4, dragRef.current.origY + dy),
      });
    },
    [onLayoutChange]
  );

  const onHeaderPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
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
      <EldarinCorners />
      <div
        className="foundry-window__header"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
      >
        <span className="foundry-window__title">{title}</span>
        <div className="foundry-window__actions">
          <button
            type="button"
            className="foundry-window__btn"
            onClick={onMinimize}
            aria-label={layout.minimized ? "Restaurar janela" : "Recolher janela"}
            title={layout.minimized ? "Restaurar" : "Recolher"}
          >
            {layout.minimized ? "▢" : "−"}
          </button>
          <button
            type="button"
            className="foundry-window__btn foundry-window__btn--close"
            onClick={onClose}
            aria-label="Fechar janela"
            title="Fechar"
          >
            ×
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
