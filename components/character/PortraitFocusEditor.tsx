"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_PORTRAIT_FOCUS,
  focusToObjectPosition,
  type PortraitFocus,
} from "@/lib/media/portrait-focus";

type Props = {
  imageSrc: string;
  focus: PortraitFocus;
  onFocusChange: (focus: PortraitFocus) => void;
  disabled?: boolean;
};

const FRAME = 200;

export function PortraitFocusEditor({ imageSrc, focus, onFocusChange, disabled }: Props) {
  const dragRef = useRef<{ px: number; py: number; fx: number; fy: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [imageSrc]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { px: e.clientX, py: e.clientY, fx: focus.x, fy: focus.y };
    },
    [disabled, focus]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = (e.clientX - d.px) / FRAME;
      const dy = (e.clientY - d.py) / FRAME;
      onFocusChange({
        x: Math.min(1, Math.max(0, d.fx - dx)),
        y: Math.min(1, Math.max(0, d.fy - dy)),
      });
    },
    [onFocusChange]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const objectPosition = focusToObjectPosition(focus);

  return (
    <div className="portrait-focus-editor">
      <p className="sheet-portrait-hint">Arraste a foto para encaixar no círculo do token.</p>
      <div
        className="portrait-focus-frame"
        style={{ width: FRAME, height: FRAME }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="application"
        aria-label="Ajustar enquadramento do retrato"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          className="portrait-focus-img"
          style={{
            objectPosition,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            pointerEvents: "none",
          }}
          draggable={false}
        />
        <span className="portrait-focus-ring" aria-hidden />
      </div>
      <div className="portrait-focus-sliders">
        <label>
          Horizontal
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(focus.x * 100)}
            disabled={disabled}
            onChange={(e) =>
              onFocusChange({ ...focus, x: Number(e.target.value) / 100 })
            }
          />
        </label>
        <label>
          Vertical
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(focus.y * 100)}
            disabled={disabled}
            onChange={(e) =>
              onFocusChange({ ...focus, y: Number(e.target.value) / 100 })
            }
          />
        </label>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled}
          onClick={() => onFocusChange(DEFAULT_PORTRAIT_FOCUS)}
        >
          Centralizar
        </button>
      </div>
    </div>
  );
}
