"use client";

import { useCallback, useRef } from "react";
import {
  DEFAULT_PORTRAIT_FOCUS,
  PORTRAIT_FOCUS_SCALE_MAX,
  PORTRAIT_FOCUS_SCALE_MIN,
  focusToObjectPosition,
  normalizePortraitFocus,
  portraitFocusToImgStyle,
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
  const normalized = normalizePortraitFocus(focus);
  const imgStyle = portraitFocusToImgStyle(normalized);
  const objectPosition = focusToObjectPosition(normalized);
  const scale = normalized.scale ?? 1;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { px: e.clientX, py: e.clientY, fx: normalized.x, fy: normalized.y };
    },
    [disabled, normalized.x, normalized.y]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = (e.clientX - d.px) / FRAME;
      const dy = (e.clientY - d.py) / FRAME;
      onFocusChange(
        normalizePortraitFocus({
          ...normalized,
          x: Math.min(1, Math.max(0, d.fx - dx)),
          y: Math.min(1, Math.max(0, d.fy - dy)),
        })
      );
    },
    [normalized, onFocusChange]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div className="portrait-focus-editor">
      <p className="sheet-portrait-hint">
        Arraste para posicionar, use os controles para zoom e veja como fica na capa da ficha e no
        token.
      </p>

      <div className="portrait-focus-previews">
        <div className="portrait-focus-preview-slot">
          <span className="portrait-focus-preview-label">Capa da ficha</span>
          <div className="portrait-focus-preview-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt="" className="sheet-portrait-img-cover" style={imgStyle} />
          </div>
        </div>
        <div className="portrait-focus-preview-slot">
          <span className="portrait-focus-preview-label">Token na mesa</span>
          <div
            className="portrait-focus-frame portrait-focus-frame--token"
            style={{ width: 88, height: 88 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="application"
            aria-label="Ajustar enquadramento arrastando"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt=""
              className="portrait-focus-img"
              style={{ objectPosition, ...imgStyle }}
              draggable={false}
            />
            <span className="portrait-focus-ring" aria-hidden />
          </div>
        </div>
      </div>

      <div
        className="portrait-focus-frame portrait-focus-frame--main"
        style={{ width: FRAME, height: FRAME }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="application"
        aria-label="Área principal de ajuste do retrato"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          className="portrait-focus-img"
          style={{ objectPosition, ...imgStyle }}
          draggable={false}
        />
        <span className="portrait-focus-ring" aria-hidden />
      </div>

      <div className="portrait-focus-sliders">
        <label>
          Posição horizontal
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(normalized.x * 100)}
            disabled={disabled}
            onChange={(e) =>
              onFocusChange(
                normalizePortraitFocus({ ...normalized, x: Number(e.target.value) / 100 })
              )
            }
          />
        </label>
        <label>
          Posição vertical
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(normalized.y * 100)}
            disabled={disabled}
            onChange={(e) =>
              onFocusChange(
                normalizePortraitFocus({ ...normalized, y: Number(e.target.value) / 100 })
              )
            }
          />
        </label>
        <label>
          Zoom ({Math.round(scale * 100)}%)
          <input
            type="range"
            min={Math.round(PORTRAIT_FOCUS_SCALE_MIN * 100)}
            max={Math.round(PORTRAIT_FOCUS_SCALE_MAX * 100)}
            value={Math.round(scale * 100)}
            disabled={disabled}
            onChange={(e) =>
              onFocusChange(
                normalizePortraitFocus({
                  ...normalized,
                  scale: Number(e.target.value) / 100,
                })
              )
            }
          />
        </label>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={disabled}
          onClick={() => onFocusChange(DEFAULT_PORTRAIT_FOCUS)}
        >
          Restaurar enquadramento
        </button>
      </div>
    </div>
  );
}
