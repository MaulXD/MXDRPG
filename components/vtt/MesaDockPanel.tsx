"use client";

import { useCallback, useRef, type ReactNode } from "react";
import {
  clampMesaPanelWidth,
  effectiveMesaPanelWidth,
  type MesaPanelLayout,
  type MesaPanelSide,
} from "@/lib/vtt/mesa-panel-layout";

type Props = {
  side: MesaPanelSide;
  label: string;
  layout: MesaPanelLayout;
  onLayoutChange: (patch: Partial<MesaPanelLayout>) => void;
  children: ReactNode;
};

export function MesaDockPanel({ side, label, layout, onLayoutChange, children }: Props) {
  const resizeRef = useRef<{ startX: number; startW: number } | null>(null);

  const onResizeStart = useCallback(
    (e: React.PointerEvent) => {
      if (layout.collapsed) return;
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = { startX: e.clientX, startW: layout.width };
      e.currentTarget.setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const r = resizeRef.current;
        if (!r) return;
        const delta = side === "left" ? ev.clientX - r.startX : r.startX - ev.clientX;
        onLayoutChange({ width: clampMesaPanelWidth(r.startW + delta) });
      };

      const onUp = (ev: PointerEvent) => {
        resizeRef.current = null;
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    },
    [layout.collapsed, layout.width, onLayoutChange, side]
  );

  const toggle = () => onLayoutChange({ collapsed: !layout.collapsed });
  const w = effectiveMesaPanelWidth(layout);

  return (
    <div
      className={`mesa-dock mesa-dock--${side}${layout.collapsed ? " mesa-dock--collapsed" : ""}`}
      style={{ width: w, flexBasis: w }}
      data-collapsed={layout.collapsed ? "true" : "false"}
    >
      {layout.collapsed ? (
        <button
          type="button"
          className="mesa-dock-expand"
          onClick={toggle}
          title={`Expandir ${label}`}
          aria-label={`Expandir ${label}`}
        >
          <span className="mesa-dock-expand-icon" aria-hidden>
            {side === "left" ? "›" : "‹"}
          </span>
          <span className="mesa-dock-vertical-label">{label}</span>
        </button>
      ) : (
        <>
          <div className="mesa-dock-chrome">
            <button
              type="button"
              className="mesa-dock-toggle"
              onClick={toggle}
              title={`Recolher ${label}`}
              aria-label={`Recolher ${label}`}
            >
              {side === "left" ? "‹" : "›"}
            </button>
            <span className="mesa-dock-label">{label}</span>
          </div>
          <div className="mesa-dock-body">{children}</div>
          <div
            className="mesa-dock-resize"
            role="separator"
            aria-orientation="vertical"
            aria-label={`Redimensionar ${label}`}
            onPointerDown={onResizeStart}
          />
        </>
      )}
    </div>
  );
}
